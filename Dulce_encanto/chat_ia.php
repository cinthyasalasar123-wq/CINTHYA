<?php
// ============================================================
// POST /chat_ia.php
// ------------------------------------------------------------
// Recibe el historial de la conversación desde el front-end,
// arma un mensaje de "sistema" con la información del negocio
// y el catálogo actual (leído de MySQL), y llama a la API de
// Claude (Anthropic) para generar la respuesta del asistente.
//
// JSON de entrada esperado:
// {
//   "historial": [
//     { "role": "user", "content": "hola, cuanto cuesta la torta de chocolate?" }
//   ]
// }
//
// JSON de salida:
// { "respuesta": "texto de la respuesta del asistente" }
// ============================================================

require "conexion.php";
require "config_ia.php"; // define $ANTHROPIC_API_KEY y $ANTHROPIC_MODELO
session_start();

header("Content-Type: application/json; charset=utf-8");

$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos || empty($datos["historial"]) || !is_array($datos["historial"])) {
    http_response_code(400);
    echo json_encode(["error" => "Falta el historial de la conversación."]);
    exit;
}

// ---------- Busca o crea la conversación de esta sesión ----------
$sessionId = session_id();
$idUsuario = $_SESSION["id_usuario"] ?? null;

$stmt = $pdo->prepare("SELECT id_conversacion FROM chat_conversaciones WHERE session_id = :sid");
$stmt->execute(["sid" => $sessionId]);
$conversacion = $stmt->fetch();

if ($conversacion) {
    $idConversacion = $conversacion["id_conversacion"];
    // Si el cliente inició sesión después de empezar a chatear, lo asociamos.
    if ($idUsuario) {
        $pdo->prepare("UPDATE chat_conversaciones SET id_usuario = :id_usuario WHERE id_conversacion = :id")
            ->execute(["id_usuario" => $idUsuario, "id" => $idConversacion]);
    }
} else {
    $pdo->prepare("INSERT INTO chat_conversaciones (session_id, id_usuario) VALUES (:sid, :id_usuario)")
        ->execute(["sid" => $sessionId, "id_usuario" => $idUsuario]);
    $idConversacion = $pdo->lastInsertId();
}

// Solo permitimos unos pocos turnos hacia atrás para no gastar
// tokens de más ni exponer un historial gigante.
$historial = array_slice($datos["historial"], -12);

// Guarda el mensaje más reciente del cliente (el último del historial
// es el que el front-end acaba de agregar antes de esta petición).
$ultimoMensaje = end($datos["historial"]);
if ($ultimoMensaje && ($ultimoMensaje["role"] ?? "") === "user") {
    $pdo->prepare(
        "INSERT INTO chat_mensajes (id_conversacion, rol, contenido) VALUES (:id, 'usuario', :contenido)"
    )->execute(["id" => $idConversacion, "contenido" => $ultimoMensaje["content"]]);
}

// ---------- Arma el contexto del negocio con el catálogo real ----------
$productos = $pdo->query(
    "SELECT categoria, nombre, presentacion, precio_referencial_pen
     FROM productos WHERE activo = 1 ORDER BY categoria, nombre"
)->fetchAll();

$catalogoTexto = "";
$categoriaActual = "";
foreach ($productos as $p) {
    if ($p["categoria"] !== $categoriaActual) {
        $categoriaActual = $p["categoria"];
        $catalogoTexto .= "\n## " . $categoriaActual . "\n";
    }
    $catalogoTexto .= sprintf(
        "- %s (%s): S/ %.2f\n",
        $p["nombre"],
        $p["presentacion"],
        $p["precio_referencial_pen"]
    );
}

// ---------- Preguntas frecuentes personalizadas ----------
// Agrega aquí tus propias preguntas y respuestas exactas.
// El asistente las usará tal cual cuando la persona pregunte
// algo parecido, en vez de inventar su propia respuesta.
$preguntasFrecuentes = [
    "¿Hacen envíos a domicilio?" => "Sí, hacemos delivery dentro de El Triunfo y alrededores. El costo se coordina por WhatsApp según la zona.",
    "¿Con cuánta anticipación debo pedir una torta?" => "Para tortas personalizadas pedimos mínimo 48 horas de anticipación. Para productos del catálogo normal, el mismo día si hay stock.",
    "¿Aceptan pagos con tarjeta?" => "Aceptamos efectivo, Yape y Plin. El pago se coordina al confirmar el pedido por WhatsApp.",
    "¿Tienen productos sin azúcar o para diabéticos?" => "Por ahora no manejamos línea sin azúcar, pero puedes escribirnos por WhatsApp para consultar alternativas según el producto.",
];

$faqTexto = "";
foreach ($preguntasFrecuentes as $pregunta => $respuesta) {
    $faqTexto .= "- P: {$pregunta}\n  R: {$respuesta}\n";
}

$promptSistema = <<<TEXTO
Eres el asistente virtual de "Dulce Encanto Pastelería", una pastelería
artesanal ubicada en El Triunfo, Zn "C", Mz "N", Lote-13. Su WhatsApp es
968 135 439 y su correo dulceencanto@gmail.com.

Responde siempre en español, de forma breve, cálida y amigable (puedes
usar algún emoji de repostería con moderación). Ayuda a las personas a
elegir productos, resuelve dudas sobre precios, presentaciones e
ingredientes, y si quieren hacer un pedido indícales que agreguen los
productos al carrito en la página y luego usen el botón "Enviar pedido
por WhatsApp". En el mismo panel del pedido pueden elegir su método
de pago (Efectivo, Yape o Plin); el pago siempre es en soles.

Estas son preguntas frecuentes con la respuesta EXACTA que debes dar
cuando te pregunten algo parecido (no la cambies, no la resumas):
{$faqTexto}

No inventes productos ni precios que no estén en este catálogo actual:
{$catalogoTexto}

Si te preguntan algo que no tiene que ver con la pastelería, redirige
la conversación amablemente hacia cómo puedes ayudarles con su pedido.
TEXTO;

// ---------- Prepara los mensajes para la API de Anthropic ----------
$mensajesApi = [];
foreach ($historial as $turno) {
    if (!isset($turno["role"], $turno["content"])) continue;
    $rol = $turno["role"] === "assistant" ? "assistant" : "user";
    $mensajesApi[] = ["role" => $rol, "content" => (string) $turno["content"]];
}

if (empty($mensajesApi)) {
    http_response_code(400);
    echo json_encode(["error" => "El historial está vacío."]);
    exit;
}

$cuerpoSolicitud = json_encode([
    "model" => $ANTHROPIC_MODELO,
    "max_tokens" => 400,
    "system" => $promptSistema,
    "messages" => $mensajesApi,
]);

// ---------- Llama a la API de Anthropic ----------
$ch = curl_init("https://api.anthropic.com/v1/messages");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $cuerpoSolicitud,
    CURLOPT_HTTPHEADER => [
        "content-type: application/json",
        "x-api-key: {$ANTHROPIC_API_KEY}",
        "anthropic-version: 2023-06-01",
    ],
    CURLOPT_TIMEOUT => 30,
]);

$respuestaCruda = curl_exec($ch);
$codigoHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$errorCurl = curl_error($ch);
curl_close($ch);

if ($errorCurl) {
    http_response_code(500);
    echo json_encode(["error" => "No se pudo conectar con la IA.", "detalle" => $errorCurl]);
    exit;
}

$respuestaApi = json_decode($respuestaCruda, true);

if ($codigoHttp !== 200 || empty($respuestaApi["content"][0]["text"])) {
    http_response_code(500);
    echo json_encode([
        "error" => "La IA no respondió correctamente.",
        "detalle" => $respuestaApi["error"]["message"] ?? $respuestaCruda,
    ]);
    exit;
}

echo json_encode(["respuesta" => $respuestaApi["content"][0]["text"]], JSON_UNESCAPED_UNICODE);

// Guarda la respuesta del asistente en el historial
$pdo->prepare(
    "INSERT INTO chat_mensajes (id_conversacion, rol, contenido) VALUES (:id, 'asistente', :contenido)"
)->execute(["id" => $idConversacion, "contenido" => $respuestaApi["content"][0]["text"]]);
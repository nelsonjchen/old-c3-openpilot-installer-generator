<?php
require_once __DIR__ . "/installer_config.php";

function fill_in_arg($placeholder, $replace_with, $binary, $padding, $arg_type) {
    $placeholder_len = strlen($placeholder);
    if ($placeholder_len < strlen($replace_with)) {
        echo "Error: Invalid " . $arg_type . " length!";
        exit;
    }

    $replace_with .= str_repeat($padding, $placeholder_len - strlen($replace_with));
    return str_replace($placeholder, $replace_with, $binary);
}

$template_path = __DIR__ . "/" . INSTALLER_TEMPLATE_BINARY;
if (!file_exists($template_path)) {
    echo "Error: missing template binary " . INSTALLER_TEMPLATE_BINARY . ". Build selfdrive/ui/installer/installers/installer_fork_template on AGNOS 18.4+ and copy it here.";
    exit;
}

$installer_binary = file_get_contents($template_path);

$username = $_GET["username"] ?? "";
$branch = $_GET["branch"] ?? "";
$loading_msg = $_GET["loading_msg"] ?? "";

if ($username == "") {
    echo "Error: username required";
    exit;
}
if ($loading_msg == "") {
    $loading_msg = $username;
}

$username = substr($username, 0, 39);
$branch = substr($branch, 0, 255);
$loading_msg = substr($loading_msg, 0, 39);

$installer_binary = fill_in_arg(
    INSTALLER_USERNAME_SLOT,
    $username . "/openpilot.git",
    $installer_binary,
    "\0",
    "username"
);

$installer_binary = fill_in_arg(
    INSTALLER_BRANCH_SLOT,
    $branch,
    $installer_binary,
    "\0",
    "branch"
);

$installer_binary = fill_in_arg(
    INSTALLER_LOADING_MSG_SLOT,
    $loading_msg,
    $installer_binary,
    " ",
    "loading message"
);

header("Content-Type: application/octet-stream");
header("Content-Length: " . strlen($installer_binary));
header("Content-Disposition: attachment; filename=installer_openpilot");
echo $installer_binary;
exit;

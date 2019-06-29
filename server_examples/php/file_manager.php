<?php

$pdo = new PDO('mysql:host=localhost;dbname=files_uploader', "root", "");
$path = pathinfo($_FILES["file"]["name"]);
$ext = $path['extension'];
$newFileName = bin2hex(random_bytes(15));

move_uploaded_file($_FILES['file']['tmp_name'], __dir__ . "/uploaded/" . $newFileName . "." . $ext);

$preparedPDO = $pdo->prepare("INSERT INTO files (name, path) VALUES (:name, :path)");
$preparedPDO->execute([
    ":name" => $newFileName,
    ":path" => $newFileName . "." . $ext
]);

 echo(json_encode([
     "status" => 6,
     "newId" => $pdo->lastInsertId(),
     "newName" => $newFileName
 ]));

/*
status
newId - new file id
newName - new file name
errorMsg - Own server error response
*/
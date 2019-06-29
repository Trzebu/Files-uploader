<?php

$action = empty($_GET["action"]) ? "error" : $_GET["action"];
$pdo = new PDO('mysql:host=localhost;dbname=files_uploader', "root", "");

switch ($action) {

    case "upload":
        if (empty($_FILES["file"])) {
            echo(json_encode([
                "status" => 5,
                "errorMsg" => "No file selected."
            ]));
            break;
        }
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
            "newName" => $newFileName . "." . $ext
        ]));
    break;

    case "delete":
        if (empty($_POST["fileId"])) {
            echo(json_encode([
                "status" => 5,
                "errorMsg" => "File ID you are searching for dose not exists."
            ]));
            break;
        }

        $selectPDO = $pdo->prepare("SELECT id, path FROM files WHERE id = ?");
        $selectPDO->bindValue(1, $_POST["fileId"]);
        $selectPDO->execute();
        $results = $selectPDO->fetchAll(PDO::FETCH_OBJ);

        if (count($results) === 0) {
            echo(json_encode([
                "status" => 5,
                "errorMsg" => "File ID you are searching for dose not exists."
            ]));
            break;
        }

        $deletePDO = $pdo->prepare("DELETE FROM files WHERE id = ?");
        $deletePDO->bindValue(1, $results[0]->id);
        $deletePDO->execute();

        unlink(__dir__ . "/uploaded/" . $results[0]->path);

        echo(json_encode([
            "status" => 7
        ]));
    break;

    case "edit":
        if (empty($_POST["newFileName"]) || empty($_POST["fileId"])) {
            echo(json_encode([
                "status" => 5,
                "errorMsg" => "You must type new file name!"
            ]));
            break;
        }

        $selectPDO = $pdo->prepare("SELECT id, path FROM files WHERE id = ?");
        $selectPDO->bindValue(1, $_POST["fileId"]);
        $selectPDO->execute();
        $results = $selectPDO->fetchAll(PDO::FETCH_OBJ);

        if (count($results) === 0) {
            echo(json_encode([
                "status" => 5,
                "errorMsg" => "File ID you are searching for dose not exists."
            ]));
            break;
        }

        $ext = pathinfo($results[0]->path)["extension"];
        $newFileName = $_POST["newFileName"] . "." . $ext;
        $uploadedPath = __dir__ . "/uploaded/";

        rename($uploadedPath . $results[0]->path, $uploadedPath . $newFileName);

        $editPDO = $pdo->prepare("UPDATE files SET name = ?, path = ? WHERE id = ?");
        $editPDO->bindValue(1, $_POST["newFileName"]);
        $editPDO->bindValue(2, $newFileName);
        $editPDO->bindValue(3, $_POST["fileId"]);
        $editPDO->execute();

        echo(json_encode([
            "status" => 9,
            "newFileName" => $newFileName
        ]));
    break;

    default:
        echo "sdsds";
}
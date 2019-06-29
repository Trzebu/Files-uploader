var FU_CONFIG = {
    "MANUAL_UPLOAD_TRIGGER": true,
    "MAX_FILES": 0,
    "MAX_FILE_SIZE": 0,
    "MAX_FILES_SIZE": 0,
    "MIN_FILE_SIZE": 0,
    "ALLOWED_EXTENSIONS": [],
    "UNALLOWED_EXTENSIONS": [],
    "IMAGE_MAX_WIDTH": 0,
    "IMAGE_MIN_WIDTH": 0,
    "IMAGE_MAX_HEIGHT": 0,
    "IMAGE_MIN_HEIGHT": 0,
    "IMAGES_PATH": "/src/images/",
    "SERVER_API": {
        "UPLOAD": "/server_examples/php/file_manager_extended.php?action=upload",
        "DELETE": "/server_examples/php/file_manager_extended.php?action=delete",
        "EDIT": "/server_examples/php/file_manager_extended.php?action=edit",
        "PREVIEW": "/server_examples/php/uploaded/"
    }
};

var MESSAGES = {
    "TYPE_ERROR": "This file has wrong extension. Correct extensions: {EXTENSIONS}.",
    "UNALLOWED_TYPE_ERROR": "This file has wrong extension. Unallowed extensions: {EXTENSIONS}.",
    "MAX_SIZE_ERROR": "This file is too large. Maximum file size is {MAX_FILE_SIZE}.",
    "MIN_SIZE_ERROR": "This file is too small. Minimum file size is {MAX_FILE_SIZE}.",
    "NO_FILES_ERROR": "No files to save.",
    "TOO_MANY_ITEMS_ERROR": "Too many files to send. Files limit is {MAX_FILES}.",
    "TOTAL_FILES_SIZE_ERROR": "The total size of files can not exceed {SIZE}.",
    "IMAGE": {
        "MAX_HEIGHT_ERROR": "This image is too high. Maximum image height is {IMAGE_HEIGHT_LIMIT} px.",
        "MIN_HEIGHT_ERROR": "This image is too small. Minimum image height is {IMAGE_MIN_HEIGHT} px.",
        "MAX_WIDTH_ERROR": "This image is too wide. Maximum image width is {IMAGE_WIDTH_LIMIT} px.",
        "MIN_WIDTH_ERROR": "This image is too small. Minimum image width is {IMAGE_MIN_WIDTH} px."
    },
    "ON_LEAVE": "Files now are uploading. If you leave page you lose your files permanently.",
    "SERVER_ERROR": "There was a problem uploading the file. Please try again later.",
    "PREPARING": "Preparing to upload.",
    "PREPARED": "File is prepared to upload.",
    "CANCEL": "Cancel",
    "DELETE": "Delete",
    "EDIT": "Edit",
    "PROCESSING": "Processing...",
    "SAVE": "Save",
    "UPLOADED": "Uploaded {TOTAL_UPLOADED} from {TOTAL_SIZE}.",
    "UPLOADER_INSIDE_ERROR": "Something went wrong. Try delete temporary files or upgrade your web browser."
}

var MIME_TO_ICON = {
    "text/plain": "text.png",
    "video/mp4": "mp4.png",
    "text/html": "html.png",
    "text/javascript": "js.png",
    "application/x-msdownload": "exe.png",
    "audio/mp3": "mp3.png"
}

var FU_TEMPLATES = {
    "FILES_LIST_ELEMENT": '<div class="fu-thumbnail-selector"><img src="' + FU_CONFIG["IMAGES_PATH"] + 'loading.gif" class="fu-loading"></div><div class="fu-file-name-selector"><span class="fu-file-name"></span><span class="fu-status">' + MESSAGES["PREPARING"] + '</span></div><div class="fu-file-manage-selector"><div class="fu-controll-buttons"><button class="fu-button-cancel">' + MESSAGES["CANCEL"] + '</button></div><div class="fu-controll-buttons-delete-edit"><button class="fu-delete-button">' + MESSAGES["DELETE"] + '</button><button class="fu-edit-button">' + MESSAGES["EDIT"] + '</button></div><div class="fu-edit-name-container"><input type="text"><button class="fu-button-edit-name-save">' + MESSAGES["SAVE"] + '</button><button class="fu-button-edit-name-cancel">' + MESSAGES["CANCEL"] + '</button></div></div>'
}

var FileUploader = function () {
    this.fileInput = document.getElementById("fuFiles");
    this.preparedFiles = [];

    if (FU_CONFIG["MANUAL_UPLOAD_TRIGGER"]) {
        var uploadButton = document.getElementById("fuManualUploadTrigger");
        uploadButton.style.display = "block";
        uploadButton.addEventListener("click", function () {
            this.upload();
        }.bind(this));
    }

    document.getElementById("fuFiles").onchange = function () {
        if (FU_CONFIG["SERVER_API"]["UPLOAD"].length == 0) {
            fuAlert(MESSAGES["SERVER_ERROR"]);
            return;
        }

        this.loadFiles();
    }.bind(this);

    this.loadFiles = function () {
        var files = this.fileInput.files;
        var totalFilesSize = 0;

        for (var i = 0; i < files.length; i++) {
            if (FU_CONFIG["MAX_FILES"] > 0 &&
                this.preparedFiles.length >= FU_CONFIG["MAX_FILES"]
            ) {
                fuAlert(MESSAGES["TOO_MANY_ITEMS_ERROR"].replace("{MAX_FILES}", FU_CONFIG["MAX_FILES"]));
                break;
            }

            totalFilesSize = totalFilesSize + files[i].size;

            if (FU_CONFIG["MAX_FILES_SIZE"] > 0 &&
                totalFilesSize >= FU_CONFIG["MAX_FILES_SIZE"]
            ) {
                fuAlert(MESSAGES["TOTAL_FILES_SIZE_ERROR"].replace("{SIZE}", sizeUnits(FU_CONFIG["MAX_FILES_SIZE"])));
                totalFilesSize = totalFilesSize - files[i].size;
                break;
            }

            this.preparedFiles.push(new File(
                files[i],
                this.preparedFiles.length
            ));
        }

        document.getElementById("fu-upload-progressbar").style.display = "block";
        this.updateUploadProgressbar();
    }

    this.update = function () {
        var filesWaitingToOther = 0;

        for (var i in this.preparedFiles) {
            var file = this.preparedFiles[i];

            if (file.status === 3) {
                filesWaitingToOther++;
            } 

        }

        if (filesWaitingToOther === 0) {
            for (var i in this.preparedFiles) {
                this.preparedFiles[i].status = 6;
            }

            return;
        }

        this.updateUploadProgressbar();
    }

    this.updateUploadProgressbar = function () {
        var totalBytesSended = 0;
        var totalFilesSize = 0;

        for (var i in this.preparedFiles) {
            var file = this.preparedFiles[i];

            if (file.status === 6) {
                continue;
            }

            totalFilesSize = totalFilesSize + file.fileData.size;
            totalBytesSended = totalBytesSended + file.totalBytesSended;

            var uploadedInfo = MESSAGES["UPLOADED"].replace("{TOTAL_UPLOADED}", sizeUnits(totalBytesSended));
            uploadedInfo = uploadedInfo.replace("{TOTAL_SIZE}", sizeUnits(totalFilesSize));

            file.selector(".fu-file-name-selector>.fu-status").innerText = uploadedInfo;
        }

        var sendedBytesPercent = parseFloat((totalBytesSended / totalFilesSize) * 100).toFixed(2);
        sendedBytesPercent = sendedBytesPercent > 100 ? 100 : sendedBytesPercent;

        document.querySelector("#fu-upload-progressbar>div>span").innerText = sizeUnits(totalBytesSended) +
                                                                          " / " +
                                                                          sizeUnits(totalFilesSize);
        document.getElementById("fu-upload-progress").style.width = sendedBytesPercent + "%";
    }

    this.removePreparedFile = function (id) {
        this.preparedFiles.splice(this.getFileIndexById(id), 1);
        this.updateUploadProgressbar();

        if (this.preparedFiles.length == 0) {
            document.getElementById("fu-upload-progressbar").style.display = "none";
        }
    }

    this.upload = function () {
        if (this.preparedFiles.length === 0) {
            fuAlert(MESSAGES["NO_FILES_ERROR"]);
            return;
        }

        for (var i in this.preparedFiles) {
            var file = this.preparedFiles[i];

            if (file.status === 1) {
                file.status = 3;
                file.upload();
            }
        }
    }

    this.getFileIndexById = function (id) {
        for (var i in this.preparedFiles) {
            if (this.preparedFiles[i].id === id) {
                return i;
            }
        }
    }
}

var fuValidator = function (file) {
    this.fileObject = file;
    this.file = file.fileData;
    this.errors = [];
    this.validationMethods = {
        "MAX_FILE_SIZE": "maxFileSize",
        "MIN_FILE_SIZE": "minFileSize",
        "ALLOWED_EXTENSIONS": "extIsInList",
        "UNALLOWED_EXTENSIONS": "extIsNotInList",
        "IMAGE_MAX_WIDTH": "maxWidth",
        "IMAGE_MIN_WIDTH": "minWidth",
        "IMAGE_MAX_HEIGHT": "maxHeihgt",
        "IMAGE_MIN_HEIGHT": "minHeihgt"
    }

    this.validate = function () {
        for (var i in this.validationMethods) {
            var ruleName = i;
            var ruleValue = FU_CONFIG[i];
            var ruleType = typeof ruleValue;
            var validationMethod = this.validationMethods[i];

            if (ruleType === "number") {
                if (ruleValue === 0) continue;
            } else if (ruleType === "string") {
                if (ruleValue.length === 0) continue;
            } else if (ruleType === "object") {
                if (ruleValue.length === 0) continue;
            } else {
                continue;
            }

            this[validationMethod]();
        }
    }

    this.maxWidth = function () {
        if (this.fileObject.imgObj.width > FU_CONFIG["IMAGE_MAX_WIDTH"]) {
            this.errors.push(MESSAGES["IMAGE"]["MAX_WIDTH_ERROR"].replace(
                "{IMAGE_WIDTH_LIMIT}", 
                FU_CONFIG["IMAGE_MAX_WIDTH"]
            ));
        }
    }

    this.minWidth = function () {
        if (this.fileObject.imgObj.width < FU_CONFIG["IMAGE_MIN_WIDTH"]) {
            this.errors.push(MESSAGES["IMAGE"]["MIN_WIDTH_ERROR"].replace(
                "{IMAGE_MIN_WIDTH}", 
                FU_CONFIG["IMAGE_MIN_WIDTH"]
            ));
        }
    }

    this.maxHeihgt = function () {
        if (this.fileObject.imgObj.height > FU_CONFIG["IMAGE_MAX_HEIGHT"]) {
            this.errors.push(MESSAGES["IMAGE"]["MAX_HEIGHT_ERROR"].replace(
                "{IMAGE_HEIGHT_LIMIT}", 
                FU_CONFIG["IMAGE_MAX_HEIGHT"]
            ));
        }
    }

    this.minHeihgt = function () {
        if (this.fileObject.imgObj.height < FU_CONFIG["IMAGE_MIN_HEIGHT"]) {
            this.errors.push(MESSAGES["IMAGE"]["MIN_HEIGHT_ERROR"].replace(
                "{IMAGE_MIN_HEIGHT}", 
                FU_CONFIG["IMAGE_MIN_HEIGHT"]
            ));
        }
    }

    this.maxFileSize = function () {
        if (this.file.size > FU_CONFIG["MAX_FILE_SIZE"]) {
            this.errors.push(MESSAGES["MAX_SIZE_ERROR"].replace(
                "{MAX_FILE_SIZE}", 
                sizeUnits(FU_CONFIG["MAX_FILE_SIZE"])
            ));
        }
    }

    this.minFileSize = function () {
        if (this.file.size < FU_CONFIG["MIN_FILE_SIZE"]) {
            this.errors.push(MESSAGES["MIN_SIZE_ERROR"].replace(
                "{MAX_FILE_SIZE}", 
                sizeUnits(FU_CONFIG["MIN_FILE_SIZE"])
            ));
        }
    }

    this.extIsInList = function () {
        for (var i in FU_CONFIG["ALLOWED_EXTENSIONS"]) {
            var allowedExt = FU_CONFIG["ALLOWED_EXTENSIONS"][i];

            if (allowedExt === this.fileObject.getExt()) {
                return;
            }
        }

        this.errors.push(MESSAGES["TYPE_ERROR"].replace(
            "{EXTENSIONS}", 
            FU_CONFIG["ALLOWED_EXTENSIONS"].join(", ")
        ));
    }

    this.extIsNotInList = function () {
        for (var i in FU_CONFIG["UNALLOWED_EXTENSIONS"]) {
            var unallowedExt = FU_CONFIG["UNALLOWED_EXTENSIONS"][i];

            if (unallowedExt === this.fileObject.getExt()) {
                this.errors.push(MESSAGES["UNALLOWED_TYPE_ERROR"].replace(
                    "{EXTENSIONS}", 
                    FU_CONFIG["UNALLOWED_EXTENSIONS"].join(", ")
                ));
            }
        }
    }

    this.isValid = function () { return this.errors.length === 0; }

    this.getFirstError = function () { return this.errors[0]; }

}

var File = function (fileData, id) {
    this.fileData = fileData;
    this.imgObj = undefined;
    this.id = id;
    this.totalBytesSended = 0;
    this.request = undefined;
    this.newFileId = 0;
    this.newFileName = undefined;
    this.status = 0;

    /**
    * Status codes:
    * 0 - preparing to upload
    * 1 - prepared to upload
    * 2 - Error in validation
    * 3 - Uploading
    * 4 - Server error while upload
    * 5 - Error in server side validation
    * 6 - Uploaded
    * 7 - Removed
    * 8 - Uploader error.
    * 9 - Edited.
    * 10 - Uploaded, waiting to upload other
    */

    this.ajax = function (method, url, data) {
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open(method, url, true);
            request.onerror = function () {
                this.status = 8;
                this.changeToError(MESSAGES["UPLOADER_INSIDE_ERROR"]);
                reject();
            }.bind(this);
            request.onload = function () {
                if (request.status === 200) {
                    resolve(JSON.parse(request.response));
                } else {
                    this.status = 4;
                    this.changeToError(MESSAGES["SERVER_ERROR"]);
                    reject();
                }
            }.bind(this);
            if (typeof FU_CONFIG["REQUEST_HEADER"] !== "undefined") {
                for (var i in FU_CONFIG["REQUEST_HEADER"]) {
                    request.setRequestHeader(i, FU_CONFIG["REQUEST_HEADER"][i]);
                }
            }
            request.send(data);
        }.bind(this));
    }

    this.showFileInList = function () {
        var listItem = document.createElement("li");
        listItem.id = "fu-file-" + this.id;
        listItem.className = "fu-in-progress";
        listItem.innerHTML = FU_TEMPLATES["FILES_LIST_ELEMENT"];

        document.getElementById("fuFilesList").appendChild(listItem);

        this.selector(".fu-file-name-selector>.fu-file-name").innerText = this.getShortName() + "." + this.getExt();

        this.loadThumbnail().then(function () {
            this.validate();
            this.cancelUploadingActivate();
        }.bind(this));
    }

    this.cancelUploadingActivate = function () {
        this.selector(".fu-file-manage-selector>div>.fu-button-cancel").addEventListener("click", function () {
            if (this.status === 3) {
                this.abortUploadingRequest();
                this.remove();
            } else if (this.status === 1) {
                this.remove()
            }
        }.bind(this));
    }

    this.remove = function () {
        this.selector().remove();
        fileUploader.removePreparedFile(this.id);
    }

    this.abortUploadingRequest = function () {
        this.request.abort();
    }

    this.validate = function () {
        var validator = new fuValidator(this);
        validator.validate();
        var statusSelector = this.selector(".fu-file-name-selector>.fu-status");
        
        if (!validator.isValid()) {
            this.status = 2;
            this.changeToError(validator.getFirstError());
            return;
        }

        statusSelector.innerText = MESSAGES["PREPARED"];
        this.status = 1;

        if (!FU_CONFIG["MANUAL_UPLOAD_TRIGGER"]) {
            this.upload();
        }
    }

    this.changeToError = function (info) {
        var span = document.createElement("span");
        this.selector(".fu-file-name-selector>.fu-status").innerText = "";

        span.classList.add("fu-status");
        span.classList.add("fu-info-error");
        span.innerText = info;
        this.selector(".fu-file-name-selector").appendChild(span);
        this.selector().classList.add("fu-error");
    }

    this.changeToSuccess = function () {
        this.selector(".fu-file-name-selector>.fu-status").innerText = "";
        this.selector().classList.add("fu-success");
    }

    this.loadThumbnail = function () {
        return new Promise(function (resolve) {
            var imgSrc = "";
            var imageElement = document.createElement("img");

            if (this.isImage()) {
                var fileReader = new FileReader();
                
                fileReader.onload = function () {
                    this.selector(".fu-thumbnail-selector>img").remove();
                    imageElement.src = fileReader.result;
                    this.selector(".fu-thumbnail-selector").appendChild(imageElement);
                    var img = new Image();
                    img.onload  = function () {
                        this.imgObj = img;
                        resolve();
                    }.bind(this);
                    img.src = fileReader.result;
                }.bind(this);
                fileReader.readAsDataURL(this.fileData);
            } else {
                this.selector(".fu-thumbnail-selector>img").remove();

                if (typeof MIME_TO_ICON[this.fileData.type] !== "undefined") {
                    imageElement.src = FU_CONFIG["IMAGES_PATH"] + MIME_TO_ICON[this.fileData.type];
                } else {
                    imageElement.src = FU_CONFIG["IMAGES_PATH"] + "file.png";
                }

                this.selector(".fu-thumbnail-selector").appendChild(imageElement);
                imageElement.className = "fu-icon";
                resolve();
            }
        }.bind(this));
    }

    this.isImage = function () { return this.fileData.type.split("/")[0] === "image"; }

    this.upload = function () {
        this.request = new XMLHttpRequest();
        var formData = new FormData();
        formData.append("file", this.fileData);
        this.request.open("POST", FU_CONFIG["SERVER_API"]["UPLOAD"], true);

        if (typeof FU_CONFIG["REQUEST_HEADER"] !== "undefined") {
            for (var i in FU_CONFIG["REQUEST_HEADER"]) {
                this.request.setRequestHeader(i, FU_CONFIG["REQUEST_HEADER"][i]);
            }
        }

        this.request.upload.addEventListener("progress", function (event) {
            if (event.lengthComputable) {
                this.totalBytesSended = event.loaded;
                fileUploader.update();
            }
        }.bind(this));

        this.request.onerror = function (event) {
            this.status = 8;
            this.changeToError(MESSAGES["UPLOADER_INSIDE_ERROR"]);
        }

        this.request.addEventListener("readystatechange", function (event) {
            if(this.request.readyState === 4) {
                if (this.request.status === 200) {
                    var response = JSON.parse(this.request.response);

                    if (typeof response["status"] === "number") {
                        if (response["status"] === 6) {
                            if (typeof response["newId"] !== "undefined") {
                                this.newFileId = response["newId"];
                            } if (typeof response["newName"] !== "undefined") {
                                this.changeFileName(response["newName"]);
                            }

                            this.status = 10;
                            this.changeToSuccess();
                            this.fileControlls();
                            fileUploader.update();
                        } else if (response["status"] === 5) {
                            this.status = 5;
                            this.changeToError(response["errorMsg"]);
                        }
                    } else {
                        this.status = 10;
                        fileUploader.update();
                    }
                } else {
                    this.status = 4;
                    this.changeToError(MESSAGES["SERVER_ERROR"]);
                }
            }
        }.bind(this));

        this.request.send(formData);
    }

    this.changeFileName = function (newName) {
        this.newFileName = newName;

        var fileName = "";
        var preparedName = this.getShortName(newName) + "." + this.getExt();

        if (FU_CONFIG["SERVER_API"]["PREVIEW"].length > 0) {
            fileName = '<a href="' + FU_CONFIG["SERVER_API"]["PREVIEW"] + newName + '">' + preparedName + '</a>';
        } else {
            fileName = preparedName;
        }

        this.selector(".fu-file-name-selector>span").innerHTML = fileName;
    }

    this.fileControlls = function () {
        this.selector(".fu-file-manage-selector>.fu-controll-buttons").style.display = "none";

        if (this.newFileId === 0) {
            return;
        }

        if (FU_CONFIG["SERVER_API"]["DELETE"].length === 0 &&
            FU_CONFIG["SERVER_API"]["EDIT"].length === 0) {
            return;
        }

        this.selector(".fu-file-manage-selector>.fu-controll-buttons-delete-edit").style.display = "flex";

        if (FU_CONFIG["SERVER_API"]["DELETE"].length > 0) {
            var deleteButton = this.selector(".fu-file-manage-selector>.fu-controll-buttons-delete-edit>.fu-delete-button");
            deleteButton.style.display = "block";
            deleteButton.addEventListener("click", function () {
                this.delete();
            }.bind(this));
        } if (FU_CONFIG["SERVER_API"]["EDIT"].length > 0) {
            var editButton = this.selector(".fu-file-manage-selector>.fu-controll-buttons-delete-edit>.fu-edit-button");
            editButton.style.display = "block";
            editButton.addEventListener("click", function () {
                this.editNameActivate();
            }.bind(this));
        }
    }

    this.editNameActivate = function () {
        this.selector(".fu-file-manage-selector>.fu-controll-buttons-delete-edit").style.display = "none";
        this.selector(".fu-file-manage-selector>.fu-edit-name-container").style.display = "flex";
        this.selector(".fu-file-manage-selector>.fu-edit-name-container>input").value = this.getFullName();

        this.selector(".fu-file-manage-selector>.fu-edit-name-container>.fu-button-edit-name-cancel").addEventListener("click", function () {
            this.editNameCancel();
        }.bind(this));

        this.selector(".fu-file-manage-selector>.fu-edit-name-container>.fu-button-edit-name-save").addEventListener("click", function () {
            this.editNameSave();
        }.bind(this));
    }

    this.editNameSave = function () {
        var newFileName = this.selector(".fu-file-manage-selector>.fu-edit-name-container>input").value;
        var data = new FormData();
        data.append("newFileName", newFileName);
        data.append("fileId", this.newFileId);

        this.selector(".fu-file-name-selector>span").innerText = MESSAGES["PROCESSING"];
        this.ajax("POST", FU_CONFIG["SERVER_API"]["EDIT"], data).then(function (resolve) {
            if (typeof resolve["newFileName"] === "undefined") {
                this.changeToError(MESSAGES["SERVER_ERROR"]);
                return;
            }

            this.changeFileName(resolve["newFileName"]);
            this.editNameCancel();
        }.bind(this));
    }

    this.editNameCancel = function () {
        this.selector(".fu-file-manage-selector>.fu-controll-buttons-delete-edit").style.display = "flex";
        this.selector(".fu-file-manage-selector>.fu-edit-name-container").style.display = "none";
    }

    this.delete = function () {
        var data = new FormData();
        data.append("fileId", this.newFileId || this.id);
        this.selector(".fu-file-name-selector>span").innerText = MESSAGES["PROCESSING"];

        this.ajax("POST", FU_CONFIG["SERVER_API"]["DELETE"], data).then(function (resolve) {
            this.remove();
        }.bind(this));
    }

    this.getShortName = function (fileName = undefined) {
        var LIMIT = 13;
        var str = this.getFullName(fileName);

        if (str.length < (LIMIT * 2)) {
            return str;
        }

        var firstPart = str.substr(0, LIMIT);
        var secPart = str.substr((str.length - LIMIT), str.length);

        return firstPart + "..." + secPart;
    }

    this.getFullName = function (fileName = undefined) {
        var str = fileName || this.newFileName || this.fileData.name;
        str = str.split(".");
        str.pop();

        return str.join("");
    }

    this.getExt = function () {
        var ext = this.fileData.name.split(".");

        return ext[ext.length - 1];
    }

    this.selector = function (query = "") {
        if (query.length > 0) {
            return document.querySelector("#fu-file-" + this.id + ">" + query);
        }
        return document.querySelector("#fu-file-" + this.id);
    }

    this.showFileInList();
}

function sizeUnits (bytes, decimals = 2) {
    if (bytes === 0) return "0B";

    var k = 1024;
    var dm = decimals < 0 ? 0 : decimals;
    var sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    var i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function fuAlert (message) {
    alert(message);
}

var fileUploader = undefined;

document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        fileUploader = new FileUploader();
    }
};
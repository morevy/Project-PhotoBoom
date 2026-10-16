// PHOTOBOOTH SCRIPT

document.addEventListener("DOMContentLoaded", () => {

    
    // DARK MODE
    

    const themeButton = document.getElementById("themeButton");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }

    const capturedPhoto = document.getElementById("capturedPhoto");

    if (capturedPhoto) {
        const savedPhoto = localStorage.getItem("capturedPhoto");

        if (savedPhoto) {
            capturedPhoto.src = savedPhoto;

        }
    }

    updateThemeIcon();

    if (themeButton) {
        themeButton.addEventListener("click", () => {
            document.body.classList.toggle("dark");

            const isDark = document.body.classList.contains("dark");

            localStorage.setItem(
                "theme",
                isDark ? "dark" : "light"
            );

            updateThemeIcon();
        });
    }

    function updateThemeIcon() {
        if (!themeButton) return;

        themeButton.textContent =
            document.body.classList.contains("dark")
                ? "☀️"
                : "🌙";
    }


    
    // PAGE TRANSITION

    const links = document.querySelectorAll("a[href]");

    links.forEach((link) => {

        link.addEventListener("click", (event) => {

            const href = link.getAttribute("href");

            if (!href || href === "#") {
                return;
            }

            // Jangan ganggu link eksternal
            if (
                link.target === "_blank" ||
                event.ctrlKey ||
                event.shiftKey ||
                event.metaKey ||
                event.button !== 0
            ) {
                return;
            }

            // Jangan ganggu link seperti mailto dan tel
            if (
                href.startsWith("http") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:")
            ) {
                return;
            }

            event.preventDefault();

            document.body.classList.add("page-exit");

            setTimeout(() => {
                window.location.href = href;
            }, 300);

        });

    });


    // CAMERA

    const camera = document.getElementById("camera");
    const startCamera = document.getElementById("start-camera");
    const takePhoto = document.getElementById("take-photo");
    const stopCamera = document.getElementById("stop-camera");
    const countdown = document.getElementById("countdown");
    const retakePhoto = document.getElementById("retake-photo");
    const deletePhoto = document.getElementById("delete-photo");

    const photoCount = document.getElementById("photo-count");

    const thumbnails = [
        document.getElementById("thumbnail-1"),
        document.getElementById("thumbnail-2"),
        document.getElementById("thumbnail-3")
    ];

    const capturedPhotos = [
        document.getElementById("captured-photo-1"),
        document.getElementById("captured-photo-2"),
        document.getElementById("captured-photo-3")
    ];

    let stream = null;
    let photos = [];
    let currentPhoto = 0;

    // PHOTO FILTER
    let currentFilter = "normal";
    const filterButtons = document.querySelectorAll(".filter-button");
    
    const filterEffects = {
        normal: "none",
        bw: "grayscale(100%)",
        cool: "brightness(1.05) saturate(0.85) hue-rotate(10deg)",
        warm: "sepia(25%) saturate(120%) brightness(1.05)"
    };

    // FILTER BUTTON
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            
            currentFilter = button.dataset.filter;
            
            // Terapkan filter ke tampilan kamera
            if (camera) {
                camera.style.filter = filterEffects[currentFilter];
            }
            
            // Tandai filter yang sedang dipilih
            filterButtons.forEach((item) => {
                item.classList.remove("active");
            });
            
            button.classList.add("active");
        
        });
    });


    
    // INITIAL BUTTON STATE

    if (takePhoto) {
        takePhoto.disabled = true;
    }

    if (stopCamera) {
        stopCamera.disabled = true;
    }

    if (retakePhoto) {
        retakePhoto.disabled = true;
    }

    if (deletePhoto) {
        deletePhoto.disabled = true;
    }

    // START CAMERA

    if (startCamera) {

        startCamera.addEventListener("click", async () => {

            try {

                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });

                if (camera) {
                    camera.srcObject = stream;
                    camera.style.display = "block";
                }

                startCamera.disabled = true;

                if (takePhoto) {
                    takePhoto.disabled = false;
                }

                if (stopCamera) {
                    stopCamera.disabled = false;
                }

            } catch (error) {

                console.error(error);

                alert(
                    "Kamera tidak dapat digunakan. Pastikan izin kamera sudah diberikan."
                );

            }

        });

    }

    
    // TAKE PHOTO
    if (takePhoto) {

        takePhoto.addEventListener("click", () => {

            if (!stream) {
                return;
            }

            if (currentPhoto >= 3) {
                return;
            }

            startCountdown();

        });

    }


    // COUNTDOWN
    function startCountdown() {

        let number = 3;

        if (!countdown) {
            capturePhoto();
            return;
        }

        countdown.textContent = number;
        countdown.style.display = "block";

        const timer = setInterval(() => {

            number--;

            if (number > 0) {

                countdown.textContent = number;

            } else {

                clearInterval(timer);

                countdown.textContent = "📸";

                setTimeout(() => {

                    countdown.style.display = "none";

                    capturePhoto();

                }, 500);

            }

        }, 1000);

    }
    
    // CAPTURE PHOTO
    function capturePhoto() {
        
        if (!camera) {
            return;
        }
        
        // Maksimal 3 foto
        if (currentPhoto >= 3) {
            return;
        }
        
        // Buat canvas
        const canvas = document.createElement("canvas");
        
        canvas.width = camera.videoWidth || camera.clientWidth;
        canvas.height = camera.videoHeight || camera.clientHeight;
        
        const context = canvas.getContext("2d");
        
        // Terapkan filter
        context.filter = filterEffects[currentFilter] || "none";
        
        // Ambil gambar dari kamera
        context.drawImage(
            camera,
            0,
            0,
            canvas.width,
            canvas.height
        
    );
    
    // Kembalikan filter
    context.filter = "none";

    // Ubah foto menjadi data URL
    const photoData = canvas.toDataURL("image/png");

    // Simpan foto ke array
    photos.push(photoData);

    // Simpan ke localStorage
    localStorage.setItem(
        "capturedPhotos",
        JSON.stringify(photos)
    );

    // Tampilkan thumbnail
    if (thumbnails[currentPhoto]) {
        thumbnails[currentPhoto].src = photoData;
        thumbnails[currentPhoto].style.display = "block";
    }

    if (capturedPhotos[currentPhoto]) {
        capturedPhotos[currentPhoto].src = photoData;
        capturedPhotos[currentPhoto].style.display = "block";
    }

    // Tambah nomor foto
    currentPhoto++;

    // Update counter
    if (photoCount) {
        if (currentPhoto < 3) {
            photoCount.textContent = currentPhoto + 1;
        } else {
            photoCount.textContent = "3";
        }
    }

    // Kalau sudah 3 foto
    if (currentPhoto >= 3) {

        if (takePhoto) {
            takePhoto.disabled = true;
        }

        if (retakePhoto) {
            retakePhoto.disabled = false;
        }

        console.log("3 foto sudah diambil");
    }
}


    
    // STOP CAMERA
    

    if (stopCamera) {

        stopCamera.addEventListener("click", () => {

            stopCameraStream();

        });

    }


    // STOP CAMERA FUNCTION

    function stopCameraStream() {

        if (stream) {

            stream.getTracks().forEach((track) => {
                track.stop();
            });

            stream = null;

        }

        if (camera) {
            camera.srcObject = null;
        }

        if (startCamera) {
            startCamera.disabled = false;
        }

        if (takePhoto) {
            takePhoto.disabled = true;
        }

        if (stopCamera) {
            stopCamera.disabled = true;
        }

    }


    
    // RETAKE PHOTO
    

    if (retakePhoto) {

        retakePhoto.addEventListener("click", () => {

            if (photos.length === 0) {
                return;
            }

            // Hapus foto terakhir
            photos.pop();

            // Kembali ke slot foto sebelumnya
            currentPhoto = photos.length;

            updateThumbnails();

            // Update nomor foto
            if (photoCount) {
                photoCount.textContent = currentPhoto + 1;
            }

            // Aktifkan kamera lagi
            if (!stream && startCamera) {
                startCamera.click();
            }

            if (takePhoto) {
                takePhoto.disabled = false;
            }

            if (retakePhoto) {
                retakePhoto.disabled = photos.length === 0;
            }

            if (deletePhoto) {
                deletePhoto.disabled = photos.length === 0;
            }

        });

    }


    
    // DELETE PHOTO
    

    if (deletePhoto) {

        deletePhoto.addEventListener("click", () => {

            if (photos.length === 0) {
                return;
            }

            // Hapus foto terakhir
            photos.pop();

            // Kembali ke slot foto sebelumnya
            currentPhoto = photos.length;

            updateThumbnails();

            // Update nomor foto
            if (photoCount) {
                photoCount.textContent = currentPhoto + 1;
            }

            if (takePhoto) {
                takePhoto.disabled = false;
            }

            if (retakePhoto) {
                retakePhoto.disabled = photos.length === 0;
            }

            if (deletePhoto) {
                deletePhoto.disabled = photos.length === 0;
            }

        });

    }


    
    // UPDATE THUMBNAILS

    function updateThumbnails() {

        thumbnails.forEach((thumbnail, index) => {

            if (!thumbnail) {
                return;
            }

            if (photos[index]) {

                thumbnail.src = photos[index];
                thumbnail.style.display = "block";

            } else {

                thumbnail.src = "";
                thumbnail.style.display = "none";

            }

        });

    }
    
});
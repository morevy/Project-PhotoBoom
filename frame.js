// FRAME SELECTION & AUTOMATIC PHOTO FITTING SCRIPT - PHOTOBOOM!

document.addEventListener("DOMContentLoaded", () => {

    // 1. Ambil foto yang sudah disimpan dari Booth
    let savedPhotos = JSON.parse(localStorage.getItem("capturedPhotos")) || [];

    // Fallback sample photos jika belum ada foto yang diambil
    const fallbackPhotos = [
        "images/cat1.png",
        "images/cat2.png",
        "images/cat3.png"
    ];

    const photo1 = document.getElementById("captured-photo-1");
    const photo2 = document.getElementById("captured-photo-2");
    const photo3 = document.getElementById("captured-photo-3");
    const photos = [photo1, photo2, photo3];

    // Tampilkan foto (dengan fallback jika kosong)
    photos.forEach((photo, index) => {
        if (!photo) return;
        const photoSrc = (savedPhotos && savedPhotos[index]) 
            ? savedPhotos[index] 
            : fallbackPhotos[index];

        if (photoSrc) {
            photo.src = photoSrc;
            photo.style.display = "block";
        }
    });

    // 2. Frame overlay & buttons
    const frameOverlay = document.getElementById("frame-overlay");
    const frameButtons = document.querySelectorAll(".frame-button");

    let currentFrame = localStorage.getItem("selectedFrame") || "frame1.png";
    localStorage.setItem("selectedFrame", currentFrame);

    if (frameOverlay) {
        frameOverlay.src = "images/" + currentFrame;
    }

    // Set active class pada tombol yang sesuai
    frameButtons.forEach((button) => {
        if (button.dataset.frame === currentFrame) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });

    // 3. Otomatis posisikan dan sesuaikan foto ke kotak frame secara rapi
    const defaultAdjustments = [
        { zoom: 1.0, panX: 50, panY: 50 },
        { zoom: 1.0, panX: 50, panY: 50 },
        { zoom: 1.0, panX: 50, panY: 50 }
    ];
    localStorage.setItem("photoAdjustments", JSON.stringify(defaultAdjustments));

    function updatePhotoLayout() {
        if (window.applyFrameToPhotos) {
            window.applyFrameToPhotos(currentFrame, photos, defaultAdjustments);
        }
    }

    // Terapkan penyesuaian posisi foto otomatis awal
    updatePhotoLayout();

    // Event listener tombol pilihan frame: otomatis update posisi foto saat frame berganti
    frameButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const frameName = button.dataset.frame;
            if (!frameName || !frameOverlay) return;

            currentFrame = frameName;
            frameOverlay.src = "images/" + frameName;
            localStorage.setItem("selectedFrame", frameName);

            frameButtons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");

            // Otomatis sesuaikan posisi & rotasi foto ke kotak frame yang dipilih!
            updatePhotoLayout();
        });
    });

    // 4. Tombol NEXT
    const nextButton = document.querySelector(".next-button");
    if (nextButton) {
        nextButton.addEventListener("click", () => {
            localStorage.setItem("selectedFrame", currentFrame);
            localStorage.setItem("photoAdjustments", JSON.stringify(defaultAdjustments));
        });
    }

});
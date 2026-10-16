// STICKER INTERACTION SCRIPT - PHOTOBOOM!

document.addEventListener("DOMContentLoaded", () => {

    // 1. Ambil data foto & frame dari localStorage
    const savedPhotos = JSON.parse(localStorage.getItem("capturedPhotos")) || [];
    const savedFrame = localStorage.getItem("selectedFrame") || "frame1.png";

    // Fallback sample photos jika belum mengambil foto
    const fallbackPhotos = [
        "images/cat1.png",
        "images/cat2.png",
        "images/cat3.png"
    ];

    const photo1 = document.getElementById("sticker-photo-1");
    const photo2 = document.getElementById("sticker-photo-2");
    const photo3 = document.getElementById("sticker-photo-3");
    const photos = [photo1, photo2, photo3];

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

    // Frame overlay
    const stickerFrame = document.getElementById("sticker-frame");
    if (stickerFrame) {
        stickerFrame.src = "images/" + savedFrame;
    }

    // Terapkan layout foto sesuai frame & penyesuaian dari halaman frame
    const photoAdjustments = JSON.parse(localStorage.getItem("photoAdjustments")) || null;
    if (window.applyFrameToPhotos) {
        window.applyFrameToPhotos(savedFrame, photos, photoAdjustments);
    }

    // 2. STICKER ENGINE
    const stickerLayer = document.getElementById("sticker-layer");
    const photoPreview = document.querySelector(".sticker-photo-preview");
    const stickerButtons = document.querySelectorAll(".sticker-button");
    const nextButton = document.querySelector(".sticker-navigation .next-button") || document.getElementById("sticker-next");

    let activeSticker = null;
    let stickersList = []; // Array of sticker DOM elements

    // Rehydrate stickers if already in localStorage
    const savedStickers = JSON.parse(localStorage.getItem("photoStickers")) || [];

    // Helper: Buat ID unik
    function generateId() {
        return "stk_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    }

    // Buat elemen stiker interaktif
    function createStickerElement(src, initialData = null) {
        if (!stickerLayer) return null;

        const stickerId = initialData?.id || generateId();
        const wrapper = document.createElement("div");
        wrapper.className = "interactive-sticker";
        wrapper.id = stickerId;
        wrapper.dataset.src = src;

        // Dimensi & posisi awal
        const previewRect = stickerLayer.getBoundingClientRect();
        const defaultW = Math.min(100, previewRect.width * 0.35);

        let x = previewRect.width / 2 - defaultW / 2;
        let y = previewRect.height / 2 - defaultW / 2;
        let width = defaultW;
        let height = defaultW;
        let rotation = 0;

        if (initialData && previewRect.width > 0) {
            x = initialData.relX * previewRect.width;
            y = initialData.relY * previewRect.height;
            width = initialData.relWidth * previewRect.width;
            height = initialData.relHeight * previewRect.height;
            rotation = initialData.rotation || 0;
        }

        wrapper.style.left = x + "px";
        wrapper.style.top = y + "px";
        wrapper.style.width = width + "px";
        wrapper.style.height = height + "px";
        wrapper.style.transform = `rotate(${rotation}deg)`;
        wrapper.dataset.rotation = rotation;

        // Konten gambar
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Sticker";
        img.draggable = false;
        wrapper.appendChild(img);

        // Kontrol Handles
        // 1. Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "sticker-control-btn delete-btn";
        deleteBtn.title = "Hapus Stiker";
        deleteBtn.innerHTML = "×";
        deleteBtn.type = "button";
        deleteBtn.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            removeSticker(wrapper);
        });
        wrapper.appendChild(deleteBtn);

        // 2. Rotate handle
        const rotateHandle = document.createElement("div");
        rotateHandle.className = "sticker-control-handle rotate-handle";
        rotateHandle.title = "Putar Stiker";
        rotateHandle.innerHTML = "↻";
        wrapper.appendChild(rotateHandle);

        // 3. Resize handle
        const resizeHandle = document.createElement("div");
        resizeHandle.className = "sticker-control-handle resize-handle";
        resizeHandle.title = "Ubah Ukuran";
        resizeHandle.innerHTML = "⤡";
        wrapper.appendChild(resizeHandle);

        // Bind events untuk stiker ini
        initStickerEvents(wrapper, rotateHandle, resizeHandle);

        stickerLayer.appendChild(wrapper);
        stickersList.push(wrapper);

        setActiveSticker(wrapper);
        saveStickersToStorage();

        return wrapper;
    }

    // Set active sticker (tampilkan border & handle)
    function setActiveSticker(el) {
        if (activeSticker && activeSticker !== el) {
            activeSticker.classList.remove("selected");
        }
        activeSticker = el;
        if (el) {
            el.classList.add("selected");
            // Bawa ke layer paling atas di layer stiker
            stickerLayer.appendChild(el);
        }
    }

    // Deselect sticker
    function deselectAll() {
        if (activeSticker) {
            activeSticker.classList.remove("selected");
            activeSticker = null;
        }
    }

    // Hapus stiker
    function removeSticker(el) {
        if (!el) return;
        el.remove();
        stickersList = stickersList.filter((item) => item !== el);
        if (activeSticker === el) {
            activeSticker = null;
        }
        saveStickersToStorage();
    }

    // Inisialisasi event Drag, Rotate, dan Resize menggunakan PointerEvents
    function initStickerEvents(wrapper, rotateHandle, resizeHandle) {
        let isDragging = false;
        let isResizing = false;
        let isRotating = false;

        let startPointerX = 0;
        let startPointerY = 0;
        let startLeft = 0;
        let startTop = 0;
        let startWidth = 0;
        let startHeight = 0;
        let startRotation = 0;
        let centerPoint = { x: 0, y: 0 };

        // Klik stiker -> Pilih & Mulai Drag
        wrapper.addEventListener("pointerdown", (e) => {
            if (e.target.closest(".sticker-control-btn") || e.target.closest(".sticker-control-handle")) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();

            setActiveSticker(wrapper);

            isDragging = true;
            wrapper.setPointerCapture(e.pointerId);

            startPointerX = e.clientX;
            startPointerY = e.clientY;
            startLeft = parseFloat(wrapper.style.left) || 0;
            startTop = parseFloat(wrapper.style.top) || 0;
        });

        // Resize Handle
        resizeHandle.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();

            setActiveSticker(wrapper);

            isResizing = true;
            resizeHandle.setPointerCapture(e.pointerId);

            startPointerX = e.clientX;
            startPointerY = e.clientY;
            startWidth = parseFloat(wrapper.style.width) || wrapper.offsetWidth;
            startHeight = parseFloat(wrapper.style.height) || wrapper.offsetHeight;
        });

        // Rotate Handle
        rotateHandle.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();

            setActiveSticker(wrapper);

            isRotating = true;
            rotateHandle.setPointerCapture(e.pointerId);

            const rect = wrapper.getBoundingClientRect();
            centerPoint = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            const rad = Math.atan2(e.clientY - centerPoint.y, e.clientX - centerPoint.x);
            startRotation = (rad * 180) / Math.PI;
        });

        // Pointer Move Handler (Universal)
        window.addEventListener("pointermove", (e) => {
            if (isDragging && activeSticker === wrapper) {
                const dx = e.clientX - startPointerX;
                const dy = e.clientY - startPointerY;

                let newLeft = startLeft + dx;
                let newTop = startTop + dy;

                wrapper.style.left = newLeft + "px";
                wrapper.style.top = newTop + "px";
            }

            if (isResizing && activeSticker === wrapper) {
                const dx = e.clientX - startPointerX;
                const dy = e.clientY - startPointerY;
                const change = Math.max(dx, dy);

                const newWidth = Math.max(40, Math.min(260, startWidth + change));
                const newHeight = newWidth; // Keep 1:1 aspect ratio

                wrapper.style.width = newWidth + "px";
                wrapper.style.height = newHeight + "px";
            }

            if (isRotating && activeSticker === wrapper) {
                const currentRad = Math.atan2(e.clientY - centerPoint.y, e.clientX - centerPoint.x);
                const currentDeg = (currentRad * 180) / Math.PI;
                const diffDeg = currentDeg - startRotation;

                const baseDeg = parseFloat(wrapper.dataset.rotation) || 0;
                const totalDeg = Math.round(baseDeg + diffDeg);

                wrapper.style.transform = `rotate(${totalDeg}deg)`;
                wrapper.dataset.tempRotation = totalDeg;
            }
        });

        // Pointer Up Handler
        window.addEventListener("pointerup", (e) => {
            if (isDragging) {
                isDragging = false;
                saveStickersToStorage();
            }
            if (isResizing) {
                isResizing = false;
                saveStickersToStorage();
            }
            if (isRotating) {
                isRotating = false;
                if (wrapper.dataset.tempRotation !== undefined) {
                    wrapper.dataset.rotation = wrapper.dataset.tempRotation;
                    delete wrapper.dataset.tempRotation;
                }
                saveStickersToStorage();
            }
        });
    }

    // Klik di area luar stiker -> Deselect
    document.addEventListener("pointerdown", (e) => {
        if (!e.target.closest(".interactive-sticker") && 
            !e.target.closest(".sticker-button") &&
            !e.target.closest(".sticker-toolbar")) {
            deselectAll();
        }
    });

    // 3. Listener Klik Tombol Pilihan Stiker
    stickerButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const img = button.querySelector("img");
            const stickerSrc = button.dataset.sticker || (img ? img.getAttribute("src") : "");

            if (!stickerSrc) return;
            createStickerElement(stickerSrc);
        });
    });

    // 4. Simpan Seluruh Stiker ke localStorage (dalam koordinat ternormalisasi)
    function saveStickersToStorage() {
        if (!stickerLayer) return;
        const layerRect = stickerLayer.getBoundingClientRect();
        const layerW = layerRect.width || 1;
        const layerH = layerRect.height || 1;

        const data = stickersList.map((stk) => {
            const left = parseFloat(stk.style.left) || 0;
            const top = parseFloat(stk.style.top) || 0;
            const width = parseFloat(stk.style.width) || stk.offsetWidth;
            const height = parseFloat(stk.style.height) || stk.offsetHeight;
            const rotation = parseFloat(stk.dataset.rotation) || 0;

            return {
                id: stk.id,
                src: stk.dataset.src,
                relX: left / layerW,
                relY: top / layerH,
                relWidth: width / layerW,
                relHeight: height / layerH,
                rotation: rotation
            };
        });

        localStorage.setItem("photoStickers", JSON.stringify(data));
    }

    // 5. Muat Ulang Stiker Sebelumnya (Rehydration)
    if (savedStickers && savedStickers.length > 0) {
        // Beri jeda sekejap agar ukuran DOM terhitung
        setTimeout(() => {
            savedStickers.forEach((stkData) => {
                createStickerElement(stkData.src, stkData);
            });
            deselectAll();
        }, 150);
    }

    // 6. Tombol Aksi Tambahan (Toolbar Stiker)
    const clearAllBtn = document.getElementById("sticker-clear-all");
    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", () => {
            if (confirm("Hapus semua stiker yang sudah ditempel?")) {
                stickersList.forEach((stk) => stk.remove());
                stickersList = [];
                activeSticker = null;
                saveStickersToStorage();
            }
        });
    }

    // 7. Tombol NEXT -> Simpan dan arahkan ke result.html
    if (nextButton) {
        nextButton.addEventListener("click", (e) => {
            e.preventDefault();
            deselectAll();
            saveStickersToStorage();
            window.location.href = "result.html";
        });
    }

});

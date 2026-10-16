// FRAME CONFIGURATIONS & PHOTO BOX ALIGNMENT - PHOTOBOOM!
// Menyimpan koordinat, ukuran, dan rotasi kotak foto untuk masing-masing frame (frame1 - frame10)

window.FRAME_CONFIGS = {
    // Frame 1: Cute Pink Embroidered Ribbons with Cats (Box 1 miring -4.5°, Box 2 lurus, Box 3 miring +4.8°)
    "frame1.png": [
        { top: 12.3, left: 17.5, width: 63.5, height: 17.0, rotate: -4.5, radius: 4 },
        { top: 42.0, left: 19.5, width: 61.0, height: 16.5, rotate: 0.0, radius: 4 },
        { top: 71.0, left: 18.0, width: 63.5, height: 17.0, rotate: 4.8, radius: 4 }
    ],

    // Frame 2: Snoopy Polaroids (3 polaroid putih lurus berjejer)
    "frame2.png": [
        { top: 5.30, left: 8.25, width: 83.50, height: 19.40, rotate: 0.0, radius: 0 },
        { top: 34.30, left: 8.25, width: 83.50, height: 19.40, rotate: 0.0, radius: 0 },
        { top: 63.25, left: 8.40, width: 83.35, height: 19.35, rotate: 0.0, radius: 0 }
    ],

    // Frame 3: Ocean Blvd Beach & Bunny (Box 1 miring +12.65°, Box 2 miring -0.95°, Box 3 miring -7.40°)
    "frame3.png": [
        { top: 8.00, left: 12.40, width: 78.55, height: 16.72, rotate: 12.65, radius: 0 },
        { top: 35.00, left: 10.20, width: 79.70, height: 16.80, rotate: -0.95, radius: 0 },
        { top: 62.15, left: 11.65, width: 78.35, height: 16.68, rotate: -7.40, radius: 0 }
    ],

    // Frame 4: Spider-man Comic Strip (3 kotak merah lurus)
    "frame4.png": [
        { top: 6.65, left: 7.00, width: 86.05, height: 19.92, rotate: 0.0, radius: 0 },
        { top: 33.63, left: 7.00, width: 86.05, height: 19.92, rotate: 0.0, radius: 0 },
        { top: 61.45, left: 7.00, width: 86.05, height: 19.92, rotate: 0.0, radius: 0 }
    ],

    // Frame 5: Hello Kitty (3 polaroid Sanrio)
    "frame5.png": [
        { top: 12.50, left: 6.12, width: 89.30, height: 20.70, rotate: 0.0, radius: 0 },
        { top: 38.00, left: 6.12, width: 89.30, height: 20.70, rotate: 0.0, radius: 0 },
        { top: 63.56, left: 6.12, width: 89.30, height: 20.70, rotate: 0.0, radius: 0 }
    ],

    // Frame 6: Vintage Moments Camera (3 kotak potret tinggi)
    "frame6.png": [
        { top: 6.20, left: 15.85, width: 68.30, height: 25.90, rotate: 0.0, radius: 0 },
        { top: 34.88, left: 15.85, width: 68.30, height: 25.90, rotate: 0.0, radius: 0 },
        { top: 63.60, left: 15.85, width: 68.30, height: 25.45, rotate: 0.0, radius: 0 }
    ],

    // Frame 7: Lana Del Rey Plaid (3 polaroid horizontal)
    "frame7.png": [
        { top: 12.48, left: 11.75, width: 74.60, height: 15.70, rotate: 0.0, radius: 0 },
        { top: 38.04, left: 11.75, width: 74.60, height: 15.70, rotate: 0.0, radius: 0 },
        { top: 63.65, left: 12.80, width: 74.75, height: 15.70, rotate: 0.0, radius: 0 }
    ],

    // Frame 8: Polkadot Pixel Cat (3 kotak vertikal)
    "frame8.png": [
        { top: 6.20, left: 15.85, width: 68.30, height: 25.90, rotate: 0.0, radius: 0 },
        { top: 34.88, left: 15.85, width: 68.30, height: 25.90, rotate: 0.0, radius: 0 },
        { top: 63.60, left: 15.85, width: 68.30, height: 25.90, rotate: 0.0, radius: 0 }
    ],

    // Frame 9: Black Aesthetic Cats & Stars (3 kartu rounded lebar)
    "frame9.png": [
        { top: 2.22, left: 4.00, width: 92.00, height: 20.50, rotate: 0.0, radius: 6 },
        { top: 33.75, left: 4.00, width: 92.00, height: 20.50, rotate: 0.0, radius: 6 },
        { top: 65.24, left: 4.00, width: 92.00, height: 20.50, rotate: 0.0, radius: 6 }
    ],

    // Frame 10: F1 Racing George Russell (3 kotak rounded)
    "frame10.png": [
        { top: 8.80, left: 12.45, width: 74.90, height: 17.10, rotate: 0.0, radius: 6 },
        { top: 32.95, left: 12.45, width: 74.90, height: 17.10, rotate: 0.0, radius: 6 },
        { top: 57.05, left: 12.45, width: 74.90, height: 17.10, rotate: 0.0, radius: 6 }
    ]
};

// Ambil konfigurasi untuk frame tertentu (fallback ke frame1 jika tidak ditemukan)
window.getFrameConfig = function(frameName) {
    if (!frameName) return window.FRAME_CONFIGS["frame1.png"];
    // Bersihkan path jika mengandung 'images/'
    const baseName = frameName.replace(/^images\//, "");
    return window.FRAME_CONFIGS[baseName] || window.FRAME_CONFIGS["frame1.png"];
};

// Terapkan tata letak kotak frame ke elemen DOM foto
window.applyFrameToPhotos = function(frameName, photoElements, adjustments = null) {
    const slots = window.getFrameConfig(frameName);
    if (!slots || !photoElements) return;

    photoElements.forEach((photoEl, index) => {
        if (!photoEl || !slots[index]) return;
        const slot = slots[index];

        // Posisi & dimensi kotak
        photoEl.style.position = "absolute";
        photoEl.style.top = slot.top + "%";
        photoEl.style.left = slot.left + "%";
        photoEl.style.width = slot.width + "%";
        photoEl.style.height = slot.height + "%";
        photoEl.style.transform = `rotate(${slot.rotate}deg)`;
        const borderRadiusPx = slot.radius !== undefined ? slot.radius : 4;
        photoEl.style.borderRadius = borderRadiusPx + "px";
        photoEl.style.objectFit = "cover";
        photoEl.style.transition = "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease, transform 0.3s ease";

        // Terapkan manual adjustment jika ada (zoom & pan)
        if (adjustments && adjustments[index]) {
            const adj = adjustments[index];
            const scale = adj.zoom || 1.0;
            const panX = adj.panX !== undefined ? adj.panX : 50;
            const panY = adj.panY !== undefined ? adj.panY : 50;

            photoEl.style.objectPosition = `${panX}% ${panY}%`;
            if (scale !== 1.0) {
                photoEl.style.transform = `rotate(${slot.rotate}deg) scale(${scale})`;
            }
        } else {
            photoEl.style.objectPosition = "50% 50%";
        }
    });
};

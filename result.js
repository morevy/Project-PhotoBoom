// RESULT & EXPORT SCRIPT - PHOTOBOOM!

document.addEventListener("DOMContentLoaded", () => {

    const exportCanvas = document.getElementById("export-canvas");
    const finalPhotoImg = document.getElementById("final-photo-img");
    const loadingSpinner = document.getElementById("loading-spinner");

    const btnDownload = document.getElementById("btn-download");
    const btnCopyLink = document.getElementById("btn-copy-link");
    const btnShareWa = document.getElementById("btn-share-wa");
    const btnShareIg = document.getElementById("btn-share-ig");
    const btnShareNative = document.getElementById("btn-share-native");
    const toast = document.getElementById("result-toast");

    let finalDataUrl = null;
    let finalBlob = null;

    // Toast Notification Helper
    function showToast(message, duration = 3000) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, duration);
    }

    // Helper: Muat gambar sebagai Promise
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (err) => {
                console.warn("Gagal memuat gambar:", src, err);
                resolve(null); // Resolve null agar tidak memutus rantai render
            };
            img.src = src;
        });
    }

    //Gambar foto dengan cover aspect ratio di dalam kotak slot, mendukung rotasi, pan, & zoom
    function drawSlotPhoto(ctx, img, slot, adjustment, targetW, targetH) {
        if (!img || !slot) return;

        const cx = ((slot.left + slot.width / 2) / 100) * targetW;
        const cy = ((slot.top + slot.height / 2) / 100) * targetH;
        const w = (slot.width / 100) * targetW;
        const h = (slot.height / 100) * targetH;
        const rotateDeg = slot.rotate || 0;
        const radiusPx = slot.radius !== undefined ? slot.radius : 3;
        const radius = (radiusPx / 220) * targetW;

        const zoom = adjustment?.zoom || 1.0;
        const panX = adjustment?.panX !== undefined ? adjustment.panX : 50;
        const panY = adjustment?.panY !== undefined ? adjustment.panY : 50;

        ctx.save();
        ctx.translate(cx, cy);
        if (rotateDeg !== 0) {
            ctx.rotate((rotateDeg * Math.PI) / 180);
        }

        // Rounded clip
        ctx.beginPath();
        if (radius > 0 && ctx.roundRect) {
            ctx.roundRect(-w / 2, -h / 2, w, h, radius);
        } else {
            ctx.rect(-w / 2, -h / 2, w, h);
        }
        ctx.clip();

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const slotRatio = w / h;

        let baseW, baseH;
        if (imgRatio > slotRatio) {
            baseH = h;
            baseW = h * imgRatio;
        } else {
            baseW = w;
            baseH = w / imgRatio;
        }

        const renderW = baseW * zoom;
        const renderH = baseH * zoom;

        const extraX = renderW - w;
        const extraY = renderH - h;
        const renderX = -w / 2 - (extraX * (panX / 100));
        const renderY = -h / 2 - (extraY * (panY / 100));

        ctx.drawImage(img, renderX, renderY, renderW, renderH);
        ctx.restore();
    }

    // MAIN RENDER PIPELINE
    async function renderFinalComposite() {
        try {
            // 1. Ambil data dari localStorage
            const savedPhotos = JSON.parse(localStorage.getItem("capturedPhotos")) || [];
            const selectedFrame = localStorage.getItem("selectedFrame") || "frame1.png";
            const photoStickers = JSON.parse(localStorage.getItem("photoStickers")) || [];
            const photoAdjustments = JSON.parse(localStorage.getItem("photoAdjustments")) || [];

            const fallbackPhotos = [
                "images/cat1.png",
                "images/cat2.png",
                "images/cat3.png"
            ];

            const photoSources = [
                savedPhotos[0] || fallbackPhotos[0],
                savedPhotos[1] || fallbackPhotos[1],
                savedPhotos[2] || fallbackPhotos[2]
            ];

            // 2. Muat Frame Overlay
            const frameImg = await loadImage("images/" + selectedFrame);
            if (!frameImg) {
                throw new Error("Frame tidak dapat dimuat");
            }

            // Gunakan resolusi native frame
            const targetW = frameImg.naturalWidth || 591;
            const targetH = frameImg.naturalHeight || 1772;

            exportCanvas.width = targetW;
            exportCanvas.height = targetH;
            const ctx = exportCanvas.getContext("2d");

            // Bersihkan canvas & beri warna dasar putih pada area slot
            ctx.clearRect(0, 0, targetW, targetH);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, targetW, targetH);

            // Layer 1: Gambar 3 foto ke dalam 3 slot presisi sesuai konfigurasi frame & penyesuaian pengguna
            const frameSlots = window.getFrameConfig ? window.getFrameConfig(selectedFrame) : null;
            const photoImages = await Promise.all(photoSources.map(src => loadImage(src)));

            photoImages.forEach((img, idx) => {
                if (img && frameSlots && frameSlots[idx]) {
                    drawSlotPhoto(ctx, img, frameSlots[idx], photoAdjustments[idx], targetW, targetH);
                }
            });

            // Layer 2: Gambar frame overlay (dengan area foto transparan) di ATAS foto
            // sehingga objek dekoratif (Spider-Man, Hello Kitty, pita, kucing, dll.) tidak tertimpa foto
            ctx.drawImage(frameImg, 0, 0, targetW, targetH);

            // Layer 3: Gambar Stiker di atas foto dan frame
            if (photoStickers && photoStickers.length > 0) {
                for (const stk of photoStickers) {
                    const stkImg = await loadImage(stk.src);
                    if (!stkImg) continue;

                    const destX = stk.relX * targetW;
                    const destY = stk.relY * targetH;
                    const destW = stk.relWidth * targetW;
                    const destH = stk.relHeight * targetH;
                    const rotation = stk.rotation || 0;

                    const centerX = destX + destW / 2;
                    const centerY = destY + destH / 2;

                    ctx.save();
                    ctx.translate(centerX, centerY);

                    if (rotation !== 0) {
                        ctx.rotate((rotation * Math.PI) / 180);
                    }

                    const imgRatio = stkImg.naturalWidth / stkImg.naturalHeight;

                    let drawW = destW;
                    let drawH = destW / imgRatio;

                    if (drawH > destH) {
                        drawH = destH;
                        drawW = drawH * imgRatio;
                    }

                    ctx.drawImage(stkImg, -drawW / 2, -drawH / 2, drawW, drawH);
                    ctx.restore();
                }
            }

            // 3. Konversi hasil akhir ke dataURL dan Blob
            finalDataUrl = exportCanvas.toDataURL("image/png", 1.0);

            exportCanvas.toBlob((blob) => {
                finalBlob = blob;
            }, "image/png");

            // Tampilkan pada halaman
            if (finalPhotoImg) {
                finalPhotoImg.src = finalDataUrl;
                finalPhotoImg.style.display = "block";
            }
            if (loadingSpinner) {
                loadingSpinner.style.display = "none";
            }

        } catch (error) {
            console.error("Gagal merender composite photo strip:", error);
            if (loadingSpinner) {
                loadingSpinner.innerHTML = "<p>Gagal memuat hasil foto. Silakan muat ulang halaman.</p>";
            }
        }
    }

    // Jalankan render saat halaman selesai dimuat
    renderFinalComposite();

    // 4. DOWNLOAD HANDLER
    if (btnDownload) {
        btnDownload.addEventListener("click", () => {
            if (!finalDataUrl) {
                showToast("Sedang menyiapkan fotomu, tunggu sebentar ya... ⏳");
                return;
            }

            const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
            const fileName = `PHOTOBOOM-${timestamp}.png`;

            const link = document.createElement("a");
            link.download = fileName;
            link.href = finalDataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("Foto berhasil diunduh! 📥💖");
        });
    }

    // 5. COPY LINK HANDLER
    if (btnCopyLink) {
        btnCopyLink.addEventListener("click", async () => {
            const currentUrl = window.location.href;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(currentUrl);
                } else {
                    const tempInput = document.createElement("input");
                    tempInput.value = currentUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand("copy");
                    document.body.removeChild(tempInput);
                }
                showToast("Tautan berhasil disalin ke clipboard! 📋✨");
            } catch (err) {
                showToast("Gagal menyalin tautan. Silakan salin URL di browser.");
            }
        });
    }

    // 6. WHATSAPP SHARE HANDLER
    if (btnShareWa) {
        btnShareWa.addEventListener("click", () => {
            const text = encodeURIComponent(
                `Lihat hasil photobooth lucuku di PHOTOBOOM! 🐱📸✨\n${window.location.href}`
            );
            window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
        });
    }

    // 7. INSTAGRAM SHARE HANDLER
    if (btnShareIg) {
        btnShareIg.addEventListener("click", () => {
            showToast("Mengunduh foto untuk dibagikan ke Instagram Story/Feed... 📸");
            if (btnDownload) {
                btnDownload.click();
            }
        });
    }

    // 8. WEB SHARE API HANDLER (NATIVE)
    if (btnShareNative) {
        btnShareNative.addEventListener("click", async () => {
            if (!navigator.share) {
                if (btnCopyLink) btnCopyLink.click();
                return;
            }

            try {
                if (finalBlob && navigator.canShare) {
                    const file = new File([finalBlob], "PHOTOBOOM.png", { type: "image/png" });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: "PHOTOBOOM! Photo Strip",
                            text: "Cek hasil foto photobooth lucuku! 🐱✨",
                            files: [file]
                        });
                        return;
                    }
                }

                await navigator.share({
                    title: "PHOTOBOOM! Photo Strip",
                    text: "Cek hasil foto photobooth lucuku! 🐱✨",
                    url: window.location.href
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    showToast("Fitur berbagi dibatalkan atau tidak didukung.");
                }
            }
        });
    }

});

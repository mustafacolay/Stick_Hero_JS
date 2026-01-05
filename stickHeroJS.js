// Javascript'in temel islevlerini genisletiyorum
Array.prototype.last = function() { // Dizinin son elemanini donduren bir fonksiyon
    return this[this.length - 1];
};

// Radyanlar yerine dereceleri kabul eden bir sinus fonksiyonu yaziyorum
Math.sinus = function(degree) {
    return Math.sin((degree / 180) * Math.PI); // Derecenin radyana donusumunu yaptim
};

// Oyun verileri
let phase = "waiting"; // Bekleme durumu
let lastTimestamp; // Onceki requestAnimationFrame dongusunun zaman islemi

let heroX; // Ileri dogru hareket ettiginde degisir
let heroY; // Sadece düstügünde degisir
let sceneOffset; // Tüm oyunu hareket ettirir

let platforms = []; // Platformlar dizisi
let sticks = []; // Sopalar dizisi
let trees = []; // Agaclar dizisi

let score = 0; // Skor girdisi

// Yapılandırma
const canvasWidth = 375; // Tuval genisligi
const canvasHeight = 375; // Tuval yuksekligi
const platformHeight = 100; // Platform yuksekligi
const heroDistanceFromEdge = 10; // Kenardan kahramanin uzakligi (beklerken)
const paddingX = 100; // Kahramanin orijinal tuval boyutundan beklemesi gereken konumu
const perfectAreaSize = 10; // Mükemmel bolge boyutu

// Arka plan, kahramandan daha yavas hareket eder
const backgroundSpeedMultiplier = 0.2; // Arka planın hızını ayarlayan çarpan

// Tepenin 1. kısmı için parametreler
const hill1BaseHeight = 100; // Tepenin taban yüksekligi
const hill1Amplitude = 10; // Tepenin genisligi
const hill1Stretch = 1; // Tepenin uzatılma oranı

// Tepenin 2. kısmı için parametreler
const hill2BaseHeight = 70; // Tepenin taban yüksekligi
const hill2Amplitude = 20; // Tepenin genisligi
const hill2Stretch = 0.5; // Tepenin uzatilma orani

const stretchingSpeed = 4; // Bir piksel cizmek icin gecen milisaniye sayisi
const turningSpeed = 4; // Bir derece döndürmek icin gecen milisaniye sayisi
const walkingSpeed = 4; // Yürüme hızı
const transitioningSpeed = 2; // Gecis hızı
const fallingSpeed = 2; // Dusme hızı

const heroWidth = 17; // Kahramanın genisligi
const heroHeight = 30; // Kahramanın yüksekligi

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Tuvali tam ekran yapiyorum
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d"); // Tuval icin 2D baglam olusturuyorum

const introductionElement = document.getElementById("introduction"); // Tanitim elementi
const perfectElement = document.getElementById("perfect"); // Mukemmel element
const restartButton = document.getElementById("restart"); // Yeniden baslatma dügmesi
const scoreElement = document.getElementById("score"); // Skor elementi

// Düzeni başlat
resetGame();

// Oyun değişkenlerini ve düzenlerini sıfırlar ancak oyunu başlatmaz (oyun, tuşa basıldığında başlar)
function resetGame() {
    // Oyun ilerlemesini sıfırla
    phase = "waiting"; // Oyun asamasi: bekleyen
    lastTimestamp = undefined; // Son zaman damgasi
    sceneOffset = 0; // Sahne konumu
    score = 0; // Skor

    introductionElement.style.opacity = 1; // Tanıtım elementinin opakligini tam yap
    perfectElement.style.opacity = 0; // Mukemmel elementin opakligini sifirla (gizle)
    restartButton.style.display = "none"; // Yeniden baslatma dugmesini gizle
    scoreElement.innerText = score; // Skor elementinin icerigini skora ayarla

    // İlk platform her zaman aynıdır
    // x + w, paddingX ile eşleşir
    platforms = [{ x: 50, w: 50 }]; // İlk platformu tanımladim
    generatePlatform(); // Yeni platformlar olusturdum
    generatePlatform();
    generatePlatform();
    generatePlatform();

    sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }]; // Çubukları tanımlar

    trees = []; // Agaclari sifirladim
    generateTree(); // Yeni agaclar olusturdum
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();

    heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge; // Kahramanın X konumunu belirler
    heroY = 0; //Kahramanin Y konumunu sıfırladim

    draw(); // Tuvali çizdirdim
}

// Yeni bir agac olusturdum
function generateTree() {
    // Agacların ne mesafeyle olusacagı max ve min degerlerini olusturdum
    const minimumGap = 30;
    const maximumGap = 150;

    // En uzaktaki agacın sağ kenarının X koordinatı bulunur.
    // Eğer bir önceki ağaç varsa, bu ağacın sağ kenarı baz alınır, yoksa sıfır kabul edilir.
    const lastTree = trees[trees.length - 1];
    let furthestX = lastTree ? lastTree.x : 0;

    // Yeni ağacın X koordinatı belirlenir.
    // Bu değer, en uzaktaki ağacın sağ kenarıyla minimum ve maksimum boşluk arasında rastgele belirlenen bir değerin toplamıdır.
    const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));

    // Ağaçların renkleri belirledim.
    const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
    // Rastgele bir renk seçtirdim.
    const color = treeColors[Math.floor(Math.random() * 3)];

    // Yeni ağaç, belirlenen X koordinatı ve renk ile ağaç dizisine eklenir.
    trees.push({ x, color });
}

//yeni platform olusturmak için bir fonksiyon yaziyorum
function generatePlatform() {
    //platformlar arası max ve min bosluk degerlerini belirliyorum.
    const minimumGap = 40;
    const maximumGap = 200;
    //platformun genislik degerlerinin max ve min aralıgını belirliyorum.
    const minimumWidth = 20;
    const maximumWidth = 100;

    // En uzaktaki platformun sag kenarının X koordinatı bulunur.
    // Eğer bir onceki platform varsa, bu platformun sag kenarı baz alınır, yoksa sıfır kabul edilir.
    const lastPlatform = platforms[platforms.length - 1];
    let furthestX = lastPlatform.x + lastPlatform.w;

    // Yeni platformun X koordinatını belirliyorum.
    // Bu deger, en uzaktaki platformun sag kenariyla minimum ve maksimum bosluk arasında rastgele belirlenen bir degerin toplamidir.
    const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));

    // Yeni platformun genisligini belirliyorum. Bu genislik max ve min arasında random bir deger olacak
    const w =
        minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

    // Yeni platform belirlenen parametrelerle birlikte platform dizisine eklenir.
    platforms.push({ x, w });
}

resetGame();
// Eğer boşluk tuşuna basıldıysa oyunu yeniden başlat
window.addEventListener("keydown", function(event) {
    if (event.key == " ") {
        event.preventDefault(); // Boşluk tuşunun varsayılan davranışını engelle (örneğin, kaydırma)
        resetGame(); // Oyunu sıfırlamak için fonksiyonu çağır
        return;
    }
});

// Fare tıklamasını bekler
// Eğer bekleme aşamasındaysak calısır
window.addEventListener("mousedown", function(event) {
    if (phase == "waiting") {
        lastTimestamp = undefined; // Son zaman damgasını belirsiz yap
        introductionElement.style.opacity = 0; // Tanıtım öğesinin opaklığını sıfırla
        phase = "stretching"; // Aşamayı "uzatma" olarak ayarla
        window.requestAnimationFrame(animate); // Animasyonu başlatmak için istek yap
    }
});

// Fare tıklamasını dinle
window.addEventListener("mouseup", function(event) {
    // Eğer "uzatma" aşamasındaysak
    if (phase == "stretching") {
        phase = "turning"; // Aşamayı "dönme" olarak ayarla
    }
});

// Pencere boyutu değişikliğini dinle
window.addEventListener("resize", function(event) {
    canvas.width = window.innerWidth; // Canvas genişliğini pencere genişliği olarak ayarla
    canvas.height = window.innerHeight; // Canvas yüksekliğini pencere yüksekliği olarak ayarla
    draw(); // Çizimi yeniden çiz
});

// Animasyon çerçevesi isteği yap
window.requestAnimationFrame(animate);

// Oyunun ana döngüsü
function animate(timestamp) {
    // İlk çağrıda, önceki zaman damgası atanır ve fonksiyon tekrar çağrılır.
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        window.requestAnimationFrame(animate);
        return;
    }

    // Oyunun durumuna bağlı olarak işlemler yapılır.
    switch (phase) {
        // "waiting" aşamasında döngü durdurulur.
        case "waiting":
            return; // Döngüyü durdur
            // "stretching" aşamasında:
        case "stretching":
            {
                // Çubuk uzatılırken, son çubuğun uzunluğu artırılır.
                sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
                break;
            }
            // "turning" durumunda:
        case "turning":
            {
                // Son çubuğun dönme açısı artırılır.
                sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

                // Dönme açısı 90 dereceden büyükse:
                if (sticks.last().rotation > 90) {
                    sticks.last().rotation = 90; // Dönme açısı 90 dereceye sabitlenir.

                    // Çubuğun çarptığı sonraki platform ve mükemmel vuruş kontrol edilir.
                    const [nextPlatform, perfectHit] = thePlatformTheStickHits();
                    if (nextPlatform) {
                        // Skor artırılır
                        score += perfectHit ? 2 : 1;
                        scoreElement.innerText = score;

                        // Mükemmel vuruş varsa, ekranın altında bir gösterge gösterilir.
                        if (perfectHit) {
                            perfectElement.style.opacity = 1;
                            setTimeout(() => (perfectElement.style.opacity = 0), 1000);
                        }

                        // Yeni bir platform ve ağaçlar oluşturulur.
                        generatePlatform();
                        generateTree();
                        generateTree();
                    }

                    // Oyunun durumu "walking" olarak değiştirilir.
                    phase = "walking";
                }
                break;
            }
        case "walking":
            {
                // Kahramanin X konumunu  yürüme hızıyla orantılı olacak sekilde güncelle,
                heroX += (timestamp - lastTimestamp) / walkingSpeed;

                // Bir sonraki platforma gecme durumu
                const [nextPlatform] = thePlatformTheStickHits();
                if (nextPlatform) {
                    // Eğer kahraman başka bir platforma ulaşırsa pozisyonunu sınırla
                    const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
                    if (heroX > maxHeroX) {
                        // Eğer kahraman maksimum X pozisyonuna ulaşırsa, geçiş aşamasına geç
                        heroX = maxHeroX;
                        phase = "transitioning";
                    }
                } else {
                    // Eğer kahraman başka bir platforma ulaşmayacaksa, pozisyonunu sınırla
                    const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
                    if (heroX > maxHeroX) {
                        // Eğer kahraman maksimum X pozisyonuna ulaşırsa, düşme aşamasına geç
                        heroX = maxHeroX;
                        phase = "falling";
                    }
                }
                break;
            }
        case "transitioning":
            {
                // Sahne ofsetini güncelle, geçiş hızıyla orantılı olarak
                sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

                // Çubuğun vurduğu bir sonraki platformu al
                const [nextPlatform] = thePlatformTheStickHits();
                if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
                    // Bir sonraki adımı ekle
                    sticks.push({
                        x: nextPlatform.x + nextPlatform.w,
                        length: 0,
                        rotation: 0
                    });
                    // Bekleme aşamasına geç
                    phase = "waiting";
                }
                break;
            }
        case "falling":
            {
                // Çubuğun son dönüş açısı 180 derecenin altındaysa
                if (sticks.last().rotation < 180)
                // Dönme hızıyla orantılı olarak çubuğun son dönüş açısını güncelle
                    sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

                // Kahramanın Y konumunu düşme hızıyla orantılı olarak güncelle,
                heroY += (timestamp - lastTimestamp) / fallingSpeed;

                // Maksimum Y pozisyonunu hesapla
                const maxHeroY =
                    platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
                if (heroY > maxHeroY) {
                    // Eğer kahraman maksimum Y pozisyonuna ulaşırsa, yeniden başlatma butonunu göster ve işlemi sonlandır
                    restartButton.style.display = "block";
                    return;
                }
                break;
            }
        default:
            // Yanlış aşama hatası fırlat
            throw Error("Wrong phase");
    }

    // Çizimi yeniden çağır
    draw();
    // Animasyonu devam ettir
    window.requestAnimationFrame(animate);

    // Son zaman damgasını güncelle
    lastTimestamp = timestamp;
}

function thePlatformTheStickHits() { // Çubuğun rotasyonunu kontrol eden fonksiyon
    if (sticks.last().rotation != 90) // Rotasyon 90 derece değilse hata ver
        throw Error(`Stick is ${sticks.last().rotation}°`);
    const stickFarX = sticks.last().x + sticks.last().length; // Çubuğun uç noktasının koordinatı hesaplanır, çubuğun vurduğu platform bulunur.
    const platformTheStickHits = platforms.find(
        (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
    );
    if ( // Çubuğun platformların orta noktasına vurup vurmadığını kontrol eden blok, vurduysa true vurmadıysa false döndürür.
        platformTheStickHits &&
        platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
        stickFarX &&
        stickFarX <
        platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
    )
        return [platformTheStickHits, true];
    return [platformTheStickHits, false];
}

function draw() {
    ctx.save(); // Oyunu kaydet
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); // Çizim alanını temizle
    drawBackground(); // Arkaplanı çiz

    // Ana çizim alanını ekranın ortasına hizala
    ctx.translate(
        (window.innerWidth - canvasWidth) / 2 - sceneOffset,
        (window.innerHeight - canvasHeight) / 2
    );

    // Ögeleri çizer
    drawPlatforms();
    drawHero();
    drawSticks();

    // Önceki durumu geri yükler
    ctx.restore();
}
restartButton.addEventListener("click", function(event) { // Yeniden başla butonuna tıklanıldığında gerçekleşecek olayları tanımlar.
    event.preventDefault();
    resetGame();
    restartButton.style.display = "none";
});

function drawPlatforms() { // Platformları çizen fonksiyon
    platforms.forEach(({ x, w }) => { // Platform rengi siyah tanımlanır. x,y büyüklükleri ayarlanır.
        ctx.fillStyle = "black";
        ctx.fillRect(
            x,
            canvasHeight - platformHeight,
            w,
            platformHeight + (window.innerHeight - canvasHeight) / 2
        );
        // Kahramanın bulunmadığı platformun ortasına kırmızı nokta çizer.
        if (sticks.last().x < x) {
            ctx.fillStyle = "red";
            ctx.fillRect(
                x + w / 2 - perfectAreaSize / 2,
                canvasHeight - platformHeight,
                perfectAreaSize,
                perfectAreaSize
            );
        }
    });
}

function drawHero() { // Ana karakteri, kahramanı çizen fonksiyon.
    ctx.save();
    ctx.fillStyle = "black"; // Siyah tanımlanır
    ctx.translate(
        heroX - heroWidth / 2,
        heroY + canvasHeight - platformHeight - heroHeight / 2 // x,y koordinatlarına göre konumu ayarlanır.
    );

    // Vücudunun boyutları ayarlanır.
    drawRoundedRect(-heroWidth / 2, -heroHeight / 2,
        heroWidth,
        heroHeight - 4,
        5
    );

    // Bacaklarının boyutları ayarlanır
    const legDistance = 5;
    ctx.beginPath();
    ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();

    // Beyaz bir göz çizilir.
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
    ctx.fill();

    // Kırmızı bir bandana çizilir.
    ctx.fillStyle = "red";
    ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
    ctx.beginPath();
    ctx.moveTo(-9, -14.5);
    ctx.lineTo(-17, -18.5);
    ctx.lineTo(-14, -8.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -10.5);
    ctx.lineTo(-15, -3.5);
    ctx.lineTo(-5, -7);
    ctx.fill();

    ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) { // Fonksiyon bir yuvarlak dikdörtgen çizmemize yarar. Dikdörtgen önce çizilir daha sonra arcTo kullanılarak yuvarlak hale getirilir.
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
}

function drawSticks() { // Çubukları çizmemize yarayan fonksiyon.
    sticks.forEach((stick) => {
        ctx.save();

        // Çubuğun dönüşünü ve düşeceği yeri hesaplar.
        ctx.translate(stick.x, canvasHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);

        // Çubuğun boyutlarını ve hareketini tanımlarız.
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();

        ctx.restore();
    });
}

function drawBackground() { // Arkaplanı çizen fonksiyon
    // Gökyüzünü verilen renk paletine göre çizer.
    var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
    gradient.addColorStop(0, "#BBD691");
    gradient.addColorStop(1, "#FEF1E1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight); // Yükseliği ekranın en üstüne kadardır. Genişliği ekranın en solundan en sağına kadardır.

    // Arkaplandaki tepeleri verilen renk paletine göre çizer
    drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
    drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

    // Ağaçları çizer. Değişkendir her ağaç farklı olabilir. Her adımda ekrandan dışarı çıkan ağaçlar kaybolur ve yenisi eklenir.
    trees.forEach((tree) => drawTree(tree.x, tree.color));
}

function drawHill(baseHeight, amplitude, stretch, color) { // Tepeleri çizen fonksiyondur. Verilen yüksekliğe, ve genişliğe göre çizer. Ekranın dışına taşan tepeler kaybolur ve ilerledikçe yenisi çizilir.
    ctx.beginPath();
    ctx.moveTo(0, window.innerHeight);
    ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
    for (let i = 0; i < window.innerWidth; i++) { //baseHeight, tepenin taban yüksekiğidir. amplitude, maksimum yüksekliktir. strectch, genişliktir. Döngü halinde çalışır ve dalga şeklinde bir tepe olmasını sağlar.
        ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
    }
    ctx.lineTo(window.innerWidth, window.innerHeight);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawTree(x, color) { // Ağaçları çizen fonksiyondur.
    ctx.save();
    ctx.translate( // Ağaçların burada, tepenin üzerinde olması hedeflenir ve yüksekliği üzerinde bulunduğu tepeye göre ayarlanır.
        (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
        getTreeY(x, hill1BaseHeight, hill1Amplitude)
    );
    // Ağaçların boyutları ve tipleri sabittir.
    const treeTrunkHeight = 5;
    const treeTrunkWidth = 2;
    const treeCrownHeight = 25;
    const treeCrownWidth = 10;

    // Ağacın gövde kısmını çizer. Rengi ve boyutları sabittir. Yalnızca konumu farklıdır, tepeye göre değişmektedir.
    ctx.fillStyle = "#7D833C";
    ctx.fillRect(-treeTrunkWidth / 2, -treeTrunkHeight,
        treeTrunkWidth,
        treeTrunkHeight
    );

    // Ağacın üst kısmını çizen fonksiyon. Boyutları sabittir, rengi değişkendir. Aynı da olabilmektedir.
    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
    ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) { // Tepenin y eksenindeki konumunu döndüren fonksiyondur. Bu fonksiyona göre ilerledikçe yeni tepe oluşturulur ve tepenin arkada kalan kısmın kaybolur.
    const sineBaseY = window.innerHeight - baseHeight;
    return (
        Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
        amplitude +
        sineBaseY
    );
}

function getTreeY(x, baseHeight, amplitude) { // Ağaçların y eksenindeki konumunu döndüren fonksiyondur. Bu fonksiyona göre ilerledikçe yeni tepe oluşturulur ve arkada kalan ağaçlar kaybolur.
    const sineBaseY = window.innerHeight - baseHeight;
    return Math.sinus(x) * amplitude + sineBaseY;
}
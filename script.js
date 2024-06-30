const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const names = [];
const images = [];
const colors = [];
const pickedNames = new Set(); // Track names picked during the week
let startAngle = 0;
let spinTimeout = null;
let music = null;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const outsideRadius = 200;
const textRadius = 160;

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function drawWheel() {
    const availableNames = names.filter(name => !pickedNames.has(name));
    const arc = Math.PI / (availableNames.length / 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    availableNames.forEach((name, i) => {
        const angle = startAngle + i * arc;
        const color = colors[names.indexOf(name)] || getRandomColor(); // Get assigned color or generate one
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outsideRadius, angle, angle + arc, false);
        ctx.arc(centerX, centerY, 0, angle + arc, angle, true);
        ctx.stroke();
        ctx.fill();
        ctx.save();

        ctx.translate(centerX + Math.cos(angle + arc / 2) * textRadius, centerY + Math.sin(angle + arc / 2) * textRadius);
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        ctx.fillStyle = 'black';
        ctx.fillText(name, -ctx.measureText(name).width / 2, -10);

        const index = names.indexOf(name);
        if (images[index]) {
            const img = images[index];
            ctx.drawImage(img, -15, 10, 30, 30);
        }

        ctx.restore();
    });

    drawPointer();
}

function drawPointer() {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY + outsideRadius + 20);
    ctx.lineTo(centerX + 10, centerY + outsideRadius + 20);
    ctx.lineTo(centerX, centerY + outsideRadius - 10);
    ctx.closePath();
    ctx.fill();
}

function addName() {
    const nameInput = document.getElementById('name-input');
    const imageInput = document.getElementById('image-input');
    const name = nameInput.value.trim();
    if (name && !names.includes(name)) {
        names.push(name);
        const file = imageInput.files[0];
        if (file) {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
                img.onload = function() {
                    images.push(img);
                    colors.push(getRandomColor());
                    drawWheel();
                    updatePersonList();
                }
            };
            reader.readAsDataURL(file);
        } else {
            images.push(null);
            colors.push(getRandomColor());
            drawWheel();
            updatePersonList();
        }
        nameInput.value = '';
        imageInput.value = '';
    }
}

function removeName() {
    const nameInput = document.getElementById('name-input');
    const name = nameInput.value.trim();
    if (name) {
        const index = names.indexOf(name);
        if (index !== -1) {
            names.splice(index, 1);
            images.splice(index, 1);
            colors.splice(index, 1);
            pickedNames.delete(name); // Also remove from picked names if present
            drawWheel();
            updatePersonList();
        }
        nameInput.value = '';
    }
}

function updatePersonList() {
    const personList = document.getElementById('person-list');
    personList.innerHTML = '';

    names.forEach((name, index) => {
        const personItem = document.createElement('div');
        personItem.className = 'person-item';

        const img = images[index] ? images[index].src : '';
        const color = colors[index];

        personItem.innerHTML = `
            <img src="${img}" alt="${name}">
            <input type="text" value="${name}" oninput="renamePerson(${index}, this.value)">
            <input type="color" value="${color}" onchange="changeColor(${index}, this.value)">
            <input type="file" onchange="changePhoto(${index}, this.files[0])">
        `;

        personList.appendChild(personItem);
    });
}

function renamePerson(index, newName) {
    names[index] = newName;
    drawWheel();
    updatePersonList();
}

function changeColor(index, newColor) {
    colors[index] = newColor;
    drawWheel();
}

function changePhoto(index, file) {
    if (file) {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            img.onload = function() {
                images[index] = img;
                drawWheel();
                updatePersonList();
            }
        };
        reader.readAsDataURL(file);
    }
}

function spinWheel() {
    const availableNames = names.filter(name => !pickedNames.has(name));
    if (availableNames.length === 0) {
        alert('No available names to pick.');
        return;
    }

    // Play music if selected
    const musicInput = document.getElementById('music-input');
    if (musicInput.files.length > 0) {
        const musicFile = musicInput.files[0];
        if (music) {
            music.pause();
        }
        music = new Audio(URL.createObjectURL(musicFile));
        music.play();
    }

    const spinTimeTotal = Math.random() * 6000 + 4000; // Spin for 4-10 seconds
    const spinAngleStart = Math.random() * 10 + 10; // Spin angle
    let spinTime = 0;
    let startTime = null;

    function rotateWheel(time) {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const spinProgress = Math.min(elapsed / spinTimeTotal, 1);
        const angleIncrement = spinAngleStart * (1 - spinProgress) * Math.sin(spinProgress * Math.PI / 2);
        startAngle += angleIncrement;
        drawWheel();

        if (spinProgress < 1) {
            spinTimeout = requestAnimationFrame(rotateWheel);
        } else {
            const segments = availableNames.length;
            const arc = Math.PI / (segments / 2);
            const currentAngle = startAngle % (2 * Math.PI);
            const index = Math.floor((2 * Math.PI - currentAngle + Math.PI) / arc) % segments;
            const pickedName = availableNames[index];
            pickedNames.add(pickedName);
            displaySelectedPerson(pickedName);
            if (music) {
                music.pause();
            }
        }
    }

    if (spinTimeout) {
        cancelAnimationFrame(spinTimeout);
    }
    spinTimeout = requestAnimationFrame(rotateWheel);
}

function displaySelectedPerson(name) {
    const index = names.indexOf(name);
    const img = images[index];

    const selectedImage = document.getElementById('selected-image');
    const selectedName = document.getElementById('selected-name');

    if (img) {
        selectedImage.src = img.src;
    } else {
        selectedImage.src = '';
    }
    selectedName.textContent = name;
}

function resetWeek() {
    pickedNames.clear();
    drawWheel();
}

// Initial draw
drawWheel();
updatePersonList();

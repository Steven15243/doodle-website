let isDrawing = false;
let x = 0;
let y = 0;
const canvas = document.getElementById('doodleCanvas');
const context = canvas.getContext('2d');

canvas.addEventListener('mousedown', e => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

canvas.addEventListener('mousemove', e => {
    if (isDrawing === true) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

window.addEventListener('mouseup', e => {
    if (isDrawing === true) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = 0;
        y = 0;
        isDrawing = false;
    }
});

function drawLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

async function getPrompt() {
    const response = await fetch('http://localhost:3000/prompt');
    const data = await response.json();
    document.getElementById('prompt').innerText = data.prompt;
}

async function submitDoodle() {
    const dataUrl = canvas.toDataURL('image/png');
    const response = await fetch('http://localhost:3000/doodle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doodleUrl: dataUrl })
    });

    if (response.ok) {
        alert('Doodle submitted successfully!');
        loadDoodles();
        clearCanvas();
    } else {
        alert('Failed to submit doodle.');
    }
}

async function loadDoodles() {
    const response = await fetch('http://localhost:3000/doodles');
    const doodles = await response.json();

    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    doodles.forEach(doodle => {
        const img = document.createElement('img');
        img.src = `http://localhost:3000/${doodle.doodleUrl}`;
        gallery.appendChild(img);
    });
}

window.onload = () => {
    getPrompt();
    loadDoodles();
};

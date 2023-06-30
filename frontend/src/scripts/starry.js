export const createStarryNight = (selector) => {
  const canvas = document.querySelector(selector);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  class Star {
    constructor(x, y, size) {
      this.x = x;
      this.y = y;
      this.size = size;
    }

    draw() {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          this.x + this.size * Math.cos(2 * Math.PI * i / 5),
          this.y + this.size * Math.sin(2 * Math.PI * i / 5)
        );
        ctx.lineTo(
          this.x + this.size / 2 * Math.cos(2 * Math.PI * (i + 0.5) / 5),
          this.y + this.size / 2 * Math.sin(2 * Math.PI * (i + 0.5) / 5)
        );
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
    }
  }

  function generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 4 + 1;
      stars.push(new Star(x, y, size));
    }
    return stars;
  }

  function drawBackground() {
    ctx.fillStyle = '#000428';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawStarryNight() {
    drawBackground();
    const stars = generateStars(200);
    for (const star of stars) {
      star.draw();
    }
  }

  drawStarryNight();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawStarryNight();
  });
}

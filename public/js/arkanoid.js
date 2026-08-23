class ArkanoidHero {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    // Keep the canvas visual-only so Chrome can start page scrolls in the hero.
    this.canvas.style.touchAction = 'auto';
    this.canvas.style.pointerEvents = 'none';
    this.inputTarget = this.canvas.closest('.hero') || this.canvas;
    
    // Game state
    this.gameStarted = false;
    this.gameOver = false;
    this.autoScrollTriggered = false;
    this.showTryAgain = false;
    this.tryAgainButton = null;
    this.victory = false;
    
    // Delta time for frame-rate independent animation
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // Ball properties
    this.ball = {
      x: 0,
      y: 100,
      dx: 4,
      dy: 4,
      radius: 8,
      color: '#6B9BD1',
      active: false
    };
    this.baseBallSpeed = 9;
    
    // Paddle properties
    this.paddle = {
      width: 120,
      height: 15,
      x: 0,
      y: 0,
      color: '#1a1a1a',
      recoilOffset: 0,
      targetRecoil: 0
    };
    
    // Pixel blocks for "SAMUEL OMIDIJI"
    this.blocks = [];
    this.blockSize = 24; // Size of each pixel block (increased for bolder look)
    
    // Power-up balls
    this.extraBalls = [];
    
    // Navigation bar height
    this.navHeight = 0;
    
    // Keyboard controls
    this.keys = { left: false, right: false };
    this.paddleSpeed = 900;

    // Track touch intent so Chrome can keep vertical drags as page scrolls.
    this.touchStart = null;
    this.touchScroll = null;
    
    this.setupCanvas();
    this.init();
  }
  
  setupCanvas() {
    const updateCanvasSize = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      
      // Keep vertical scrolling under browser control.
      this.canvas.style.touchAction = 'auto';
      
      // Responsive block size based on screen width
      if (this.canvas.width < 768) {
        // Mobile - larger blocks for better visibility
        this.blockSize = Math.max(10, Math.floor(this.canvas.width / 35));
        this.ball.radius = 6;
        this.baseBallSpeed = 7;
        this.ball.dx = Math.abs(this.ball.dx) > 0 ? (this.ball.dx > 0 ? this.baseBallSpeed : -this.baseBallSpeed) : this.baseBallSpeed;
        this.ball.dy = Math.abs(this.ball.dy) > 0 ? (this.ball.dy > 0 ? this.baseBallSpeed : -this.baseBallSpeed) : this.baseBallSpeed;
        this.paddle.width = 90;
      } else {
        // Desktop
        this.blockSize = 24;
        this.ball.radius = 8;
        this.baseBallSpeed = 9;
        this.ball.dx = Math.abs(this.ball.dx) > 0 ? (this.ball.dx > 0 ? this.baseBallSpeed : -this.baseBallSpeed) : this.baseBallSpeed;
        this.ball.dy = Math.abs(this.ball.dy) > 0 ? (this.ball.dy > 0 ? this.baseBallSpeed : -this.baseBallSpeed) : this.baseBallSpeed;
        this.paddle.width = 120;
      }
      
      // Keep the main ball speed consistent with the base speed
      this.normalizeBallSpeed(this.ball);
      
      this.createPixelText();
    };
    
    updateCanvasSize();
    window.addEventListener('resize', () => {
      updateCanvasSize();
      this.paddle.y = this.canvas.height - 80;
      this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    });
  }
  
  init() {
    // Get navigation bar height
    const nav = document.querySelector('.nav');
    if (nav) {
      this.navHeight = nav.offsetHeight;
    }
    
    // Initialize paddle position
    this.paddle.y = this.canvas.height - 80;
    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    
    // Initialize ball position on paddle
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius;
    
    // Create pixel text blocks
    this.createPixelText();
    
    // Event listeners for paddle control
    // Use pointer events for cross-browser touch/mouse support
    this.inputTarget.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.inputTarget.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.inputTarget.addEventListener('pointerup', () => this.handlePointerEnd());
    this.inputTarget.addEventListener('pointercancel', () => this.handlePointerEnd());
    this.inputTarget.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.inputTarget.addEventListener('click', (e) => this.handleClick(e));
    this.inputTarget.addEventListener('touchstart', (e) => this.handleHeroTouchStart(e), { passive: true });
    this.inputTarget.addEventListener('touchmove', (e) => this.handleHeroTouchMove(e), { passive: false });
    this.inputTarget.addEventListener('touchend', () => this.handleHeroTouchEnd());
    this.inputTarget.addEventListener('touchcancel', () => this.handleHeroTouchEnd());
    
    // Keyboard listeners
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Try Again button event listener (just relaunch ball, don't reset blocks)
    const tryAgainBtn = document.getElementById('tryAgainButton');
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', () => this.continuePlaying());
    }
    
    // Play Again button event listener (full reset with all blocks)
    const playAgainBtn = document.getElementById('playAgainButton');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => this.resetGame());
    }
    
    // Game starts in ready state (ball on paddle)
    this.gameStarted = false;
    this.ball.active = false;
    
    // Auto launch ball after 2 seconds
    setTimeout(() => {
      this.launchBall();
    }, 2000);
    
    // Start animation loop
    this.animate();
  }
  
  createPixelText() {
    this.blocks = [];
    
    // Define pixel patterns for each letter - thicker version
    const letterPatterns = {
      'S': [
        [0,1,1,1,1,1],
        [1,1,1,0,0,0],
        [1,1,1,0,0,0],
        [0,1,1,1,1,0],
        [0,0,0,1,1,1],
        [0,0,0,1,1,1],
        [1,1,1,1,1,0]
      ],
      'A': [
        [0,1,1,1,1,0],
        [1,1,1,1,1,1],
        [1,1,0,0,1,1],
        [1,1,1,1,1,1],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1]
      ],
      'M': [
        [1,1,0,0,0,0,1,1],
        [1,1,1,0,0,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,0,1,1,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1]
      ],
      'U': [
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,1,1,1,1],
        [0,1,1,1,1,0]
      ],
      'E': [
        [1,1,1,1,1,1],
        [1,1,1,0,0,0],
        [1,1,1,0,0,0],
        [1,1,1,1,1,0],
        [1,1,1,0,0,0],
        [1,1,1,0,0,0],
        [1,1,1,1,1,1]
      ],
      'L': [
        [1,1,0,0,0,0],
        [1,1,0,0,0,0],
        [1,1,0,0,0,0],
        [1,1,0,0,0,0],
        [1,1,0,0,0,0],
        [1,1,0,0,0,0],
        [1,1,1,1,1,1]
      ],
      'O': [
        [0,1,1,1,1,0],
        [1,1,1,1,1,1],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,1,1,1,1],
        [0,1,1,1,1,0]
      ],
      'I': [
        [1,1,1,1],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0],
        [1,1,1,1]
      ],
      'D': [
        [1,1,1,1,0,0],
        [1,1,0,1,1,0],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,0,1,1,0],
        [1,1,1,1,0,0]
      ],
      'J': [
        [0,0,0,1,1],
        [0,0,0,1,1],
        [0,0,0,1,1],
        [0,0,0,1,1],
        [1,1,0,1,1],
        [1,1,0,1,1],
        [0,1,1,1,0]
      ],
      'N': [
        [1,1,0,0,0,1,1],
        [1,1,1,0,0,1,1],
        [1,1,1,1,0,1,1],
        [1,1,0,1,1,1,1],
        [1,1,0,0,1,1,1],
        [1,1,0,0,0,1,1],
        [1,1,0,0,0,1,1]
      ],
      'K': [
        [1,1,0,0,1,1],
        [1,1,0,1,1,0],
        [1,1,1,1,0,0],
        [1,1,1,0,0,0],
        [1,1,1,1,0,0],
        [1,1,0,1,1,0],
        [1,1,0,0,1,1]
      ],
      'W': [
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,1,1,0,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,0,0,1,1,1],
        [0,1,1,0,0,1,1,0]
      ],
      'V': [
        [1,1,0,0,0,1,1],
        [1,1,0,0,0,1,1],
        [1,1,0,0,0,1,1],
        [0,1,1,0,1,1,0],
        [0,1,1,0,1,1,0],
        [0,0,1,1,1,0,0],
        [0,0,0,1,0,0,0]
      ],
      'C': [
        [0,1,1,1,1,1],
        [1,1,1,1,1,1],
        [1,1,0,0,0,0],
        [1,1,0,0,0,0],
        [1,1,0,0,0,0],
        [1,1,1,1,1,1],
        [0,1,1,1,1,1]
      ],
      'T': [
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,0,0,1,1,0,0],
        [0,0,0,1,1,0,0],
        [0,0,0,1,1,0,0],
        [0,0,0,1,1,0,0],
        [0,0,0,1,1,0,0]
      ],
      'R': [
        [1,1,1,1,1,0],
        [1,1,0,0,1,1],
        [1,1,0,0,1,1],
        [1,1,1,1,1,0],
        [1,1,1,1,0,0],
        [1,1,0,1,1,0],
        [1,1,0,0,1,1]
      ]
    };
    
    // Use shorter text on mobile for better fit
    const isMobile = this.canvas.width < 768;
    const text1 = isMobile ? 'NEV' : 'NDUKWO';
    const text2 = isMobile ? 'VIC' : 'VICTOR';
    
    // Calculate center position
    const totalWidth1 = text1.split('').reduce((sum, char) => {
      return sum + (letterPatterns[char]?.[0]?.length || 3) + 2;
    }, 0) * this.blockSize;
    
    const totalWidth2 = text2.split('').reduce((sum, char) => {
      return sum + (letterPatterns[char]?.[0]?.length || 3) + 2;
    }, 0) * this.blockSize;
    
    const startX1 = (this.canvas.width - totalWidth1) / 2;
    const startX2 = (this.canvas.width - totalWidth2) / 2;
    
    // Responsive positioning
    const verticalOffset = isMobile ? this.canvas.height / 2.6 : this.canvas.height / 3;
    const lineSpacing = isMobile ? (this.blockSize * 8) : 162;
    
    const startY1 = verticalOffset - (lineSpacing / 2);
    const startY2 = verticalOffset + (lineSpacing / 2);
    
    // Create blocks for first line
    let currentX = startX1;
    for (let char of text1) {
      const pattern = letterPatterns[char];
      if (pattern) {
        for (let row = 0; row < pattern.length; row++) {
          for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col] === 1) {
              this.blocks.push({
                x: currentX + col * this.blockSize,
                y: startY1 + row * this.blockSize,
                width: this.blockSize,
                height: this.blockSize,
                active: true,
                color: '#1a1a1a'
              });
            }
          }
        }
        currentX += (pattern[0].length + 2) * this.blockSize;
      }
    }
    
    // Create blocks for second line
    currentX = startX2;
    for (let char of text2) {
      const pattern = letterPatterns[char];
      if (pattern) {
        for (let row = 0; row < pattern.length; row++) {
          for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col] === 1) {
              this.blocks.push({
                x: currentX + col * this.blockSize,
                y: startY2 + row * this.blockSize,
                width: this.blockSize,
                height: this.blockSize,
                active: true,
                color: '#1a1a1a'
              });
            }
          }
        }
        currentX += (pattern[0].length + 2) * this.blockSize;
      }
    }
    
    // Add power-ups: replace 5 random blocks with colored power-ups
    this.addPowerUps();
  }
  
  addPowerUps() {
    const activeBlocks = this.blocks.filter(b => b.active);
    if (activeBlocks.length < 5) return;
    
    // Power-up definitions
    const powerUps = [
      { color: '#FF8C00', extraBalls: 2 },  // Orange - 2 balls
      { color: '#32CD32', extraBalls: 4 },  // Green - 4 balls
      { color: '#FFD700', extraBalls: 6 },  // Yellow - 6 balls
      { color: '#C0C0C0', extraBalls: 8 },  // Silver - 8 balls
      { color: '#FFD700', extraBalls: 10 }  // Gold - 10 balls
    ];
    
    // Randomly select 5 blocks to become power-ups
    const shuffled = activeBlocks.sort(() => Math.random() - 0.5);
    for (let i = 0; i < 5; i++) {
      shuffled[i].color = powerUps[i].color;
      shuffled[i].powerUp = powerUps[i].extraBalls;
    }
  }
  
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    this.paddle.x = mouseX - this.paddle.width / 2;
    
    // Keep paddle within bounds
    if (this.paddle.x < 0) this.paddle.x = 0;
    if (this.paddle.x + this.paddle.width > this.canvas.width) {
      this.paddle.x = this.canvas.width - this.paddle.width;
    }
    
    // If ball not active, move with paddle
    if (!this.ball.active) {
      this.ball.x = this.paddle.x + this.paddle.width / 2;
    }
  }
  
  handlePointerMove(e) {
    // Only handle touch/pen, not mouse (mouse is handled separately)
    if (e.pointerType === 'mouse') return;

    if (this.isVerticalTouchScroll(e)) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    this.paddle.x = pointerX - this.paddle.width / 2;
    
    // Keep paddle within bounds
    if (this.paddle.x < 0) this.paddle.x = 0;
    if (this.paddle.x + this.paddle.width > this.canvas.width) {
      this.paddle.x = this.canvas.width - this.paddle.width;
    }
    
    // If ball not active, move with paddle
    if (!this.ball.active) {
      this.ball.x = this.paddle.x + this.paddle.width / 2;
    }
  }

  handlePointerDown(e) {
    if (e.pointerType === 'mouse') return;

    this.touchStart = {
      x: e.clientX,
      y: e.clientY,
      mode: null
    };
  }

  handlePointerEnd() {
    this.touchStart = null;
  }

  isVerticalTouchScroll(e) {
    if (!this.touchStart) return false;

    const dx = e.clientX - this.touchStart.x;
    const dy = e.clientY - this.touchStart.y;

    if (!this.touchStart.mode && Math.hypot(dx, dy) > 8) {
      this.touchStart.mode = Math.abs(dy) > Math.abs(dx) ? 'scroll' : 'paddle';
    }

    return this.touchStart.mode === 'scroll';
  }

  handleHeroTouchStart(e) {
    const touch = e.touches[0];
    if (!touch) return;

    this.touchScroll = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastY: touch.clientY,
      mode: null
    };
  }

  handleHeroTouchMove(e) {
    if (!this.touchScroll) return;

    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - this.touchScroll.startX;
    const dy = touch.clientY - this.touchScroll.startY;

    if (!this.touchScroll.mode && Math.hypot(dx, dy) > 8) {
      this.touchScroll.mode = Math.abs(dy) > Math.abs(dx) ? 'scroll' : 'paddle';
    }

    if (this.touchScroll.mode === 'scroll') {
      e.preventDefault();
      window.scrollBy({ top: this.touchScroll.lastY - touch.clientY, left: 0, behavior: 'auto' });
      this.touchScroll.lastY = touch.clientY;
    } else if (this.touchScroll.mode === 'paddle') {
      e.preventDefault(); // Prevent scrolling while playing
      const rect = this.canvas.getBoundingClientRect();
      const pointerX = touch.clientX - rect.left;
      this.paddle.x = pointerX - this.paddle.width / 2;
      
      // Keep paddle within bounds
      if (this.paddle.x < 0) this.paddle.x = 0;
      if (this.paddle.x + this.paddle.width > this.canvas.width) {
        this.paddle.x = this.canvas.width - this.paddle.width;
      }
      
      // If ball not active, move with paddle
      if (!this.ball.active) {
        this.ball.x = this.paddle.x + this.paddle.width / 2;
      }
    }
  }

  handleHeroTouchEnd() {
    this.touchScroll = null;
  }

  drawBall() {
    // Draw main ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.ball.color;
    this.ctx.fill();
    this.ctx.closePath();
    
    // Draw extra balls
    for (let extraBall of this.extraBalls) {
      if (extraBall.active) {
        this.ctx.beginPath();
        this.ctx.arc(extraBall.x, extraBall.y, extraBall.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = extraBall.color;
        this.ctx.fill();
        this.ctx.closePath();
      }
    }
  }
  
  drawPaddle() {
    // Update paddle recoil animation
    this.paddle.recoilOffset += (this.paddle.targetRecoil - this.paddle.recoilOffset) * 0.2;
    if (Math.abs(this.paddle.recoilOffset) < 0.1) this.paddle.recoilOffset = 0;
    
    this.ctx.fillStyle = this.paddle.color;
    this.ctx.fillRect(this.paddle.x, this.paddle.y + this.paddle.recoilOffset, this.paddle.width, this.paddle.height);
  }
  
  drawBlocks() {
    for (let block of this.blocks) {
      if (block.active) {
        this.ctx.fillStyle = block.color;
        this.ctx.fillRect(block.x, block.y, block.width, block.height);
      }
    }
  }
  
  handleKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = true;
      e.preventDefault();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = true;
      e.preventDefault();
    }
  }
  
  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = false;
      e.preventDefault();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = false;
      e.preventDefault();
    }
  }
  
  updatePaddleFromKeys() {
    const move = (this.keys.left ? -1 : 0) + (this.keys.right ? 1 : 0);
    if (move === 0) return;
    
    const speed = this.canvas.width < 768 ? 700 : 900;
    this.paddle.x += move * speed * this.deltaTime;
    
    // Clamp within bounds
    if (this.paddle.x < 0) this.paddle.x = 0;
    if (this.paddle.x + this.paddle.width > this.canvas.width) {
      this.paddle.x = this.canvas.width - this.paddle.width;
    }
    
    // Keep idle ball centered on paddle
    if (!this.ball.active) {
      this.ball.x = this.paddle.x + this.paddle.width / 2;
    }
  }
  
  normalizeBallSpeed(ball) {
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (speed === 0) {
      ball.dx = this.baseBallSpeed;
      ball.dy = this.baseBallSpeed;
      return;
    }
    const scale = this.baseBallSpeed / speed;
    ball.dx *= scale;
    ball.dy *= scale;
    
    // Prevent near-horizontal shots that can loop forever
    const minDy = this.baseBallSpeed * 0.25;
    if (Math.abs(ball.dy) < minDy) {
      const dySign = ball.dy === 0 ? 1 : Math.sign(ball.dy);
      const dxSign = ball.dx === 0 ? 1 : Math.sign(ball.dx);
      ball.dy = minDy * dySign;
      const remaining = Math.max(this.baseBallSpeed * this.baseBallSpeed - minDy * minDy, 0.01);
      ball.dx = Math.sqrt(remaining) * dxSign;
    }
  }
  
  handleBlockCollision(ball) {
    if (!ball.active) return false;
    
    for (let block of this.blocks) {
      if (!block.active) continue;
      
      if (
        ball.x + ball.radius > block.x &&
        ball.x - ball.radius < block.x + block.width &&
        ball.y + ball.radius > block.y &&
        ball.y - ball.radius < block.y + block.height
      ) {
        const blockCenterX = block.x + block.width / 2;
        const blockCenterY = block.y + block.height / 2;
        const dx = ball.x - blockCenterX;
        const dy = ball.y - blockCenterY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal bounce
          ball.dx = -ball.dx;
          const overlap = ball.radius + block.width / 2 - Math.abs(dx);
          ball.x += dx > 0 ? overlap : -overlap;
        } else {
          // Vertical bounce
          ball.dy = -ball.dy;
          const overlap = ball.radius + block.height / 2 - Math.abs(dy);
          ball.y += dy > 0 ? overlap : -overlap;
        }
        
        this.normalizeBallSpeed(ball);
        
        if (block.powerUp) {
          this.spawnExtraBalls(block.x + block.width / 2, block.y + block.height / 2, block.powerUp);
        }
        
        block.active = false;
        this.checkVictory();
        return true;
      }
    }
    return false;
  }
  
  checkCollision() {
    // Main ball collisions
    if (this.ball.active) {
      this.handleBlockCollision(this.ball);
    }
    
    // Extra balls collisions
    for (let extraBall of this.extraBalls) {
      if (!extraBall.active) continue;
      this.handleBlockCollision(extraBall);
    }
  }
  
  spawnExtraBalls(x, y, count) {
    // Use the same speed and properties as the main ball
    const speed = this.baseBallSpeed;
    const color = this.ball.color;
    const radius = this.ball.radius;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      this.extraBalls.push({
        x: x,
        y: y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        radius: radius,
        color: color,
        active: true
      });
    }
  }
  
  checkVictory() {
    const activeBlocks = this.blocks.filter(block => block.active).length;
    if (activeBlocks === 0 && !this.victory) {
      this.victory = true;
      this.showVictoryMessage();
    }
  }
  
  showVictoryMessage() {
    const victoryMsg = document.getElementById('victoryMessage');
    if (victoryMsg) {
      victoryMsg.style.display = 'block';
      
      // Reset animation for all words
      const words = victoryMsg.querySelectorAll('.victory-word');
      words.forEach(word => {
        word.style.animation = 'none';
        word.offsetHeight; // Trigger reflow
        word.style.animation = null;
      });
      
      // Show play again button after animation completes
      setTimeout(() => {
        this.updatePlayAgainButton(true);
      }, 2500);
    }
  }
  
  hideVictoryMessage() {
    const victoryMsg = document.getElementById('victoryMessage');
    if (victoryMsg) {
      victoryMsg.style.display = 'none';
    }
  }
  
  updatePlayAgainButton(show = false) {
    const button = document.getElementById('playAgainButton');
    if (!button) return;
    
    if (show) {
      // Show and position the button
      const rect = this.canvas.getBoundingClientRect();
      const isMobile = rect.width < 768;
      const buttonY = isMobile ? rect.height / 2 + 140 : rect.height / 2 + 180;
      
      button.style.display = 'block';
      button.style.left = '50%';
      button.style.top = `${buttonY}px`;
      button.style.transform = 'translateX(-50%)';
    } else {
      // Hide the button
      button.style.display = 'none';
    }
  }
  
  hidePlayAgainButton() {
    this.updatePlayAgainButton(false);
  }
  
  updateBall() {
    if (!this.gameStarted || this.gameOver || this.victory) return;
    
    // Apply keyboard-based paddle movement
    this.updatePaddleFromKeys();
    
    // Multiply by deltaTime and by 60 to maintain current speed at 60fps
    const speedMultiplier = this.deltaTime * 60;
    
    // Update main ball only if active
    if (this.ball.active) {
      this.ball.x += this.ball.dx * speedMultiplier;
      this.ball.y += this.ball.dy * speedMultiplier;
    }
    
    // Main ball collisions (only if active)
    if (this.ball.active) {
      // Wall collision (left/right)
      if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
        this.ball.dx = -this.ball.dx;
        this.normalizeBallSpeed(this.ball);
      }
      
      // Top collision with nav bar as ceiling
      if (this.ball.y - this.ball.radius < this.navHeight) {
        this.ball.y = this.navHeight + this.ball.radius;
        this.ball.dy = -this.ball.dy;
        this.normalizeBallSpeed(this.ball);
      }
      
      // Paddle collision
      if (
        this.ball.y + this.ball.radius >= this.paddle.y &&
        this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
        this.ball.x + this.ball.radius >= this.paddle.x &&
        this.ball.x - this.ball.radius <= this.paddle.x + this.paddle.width &&
        this.ball.dy > 0
      ) {
        // Add angle based on where ball hits paddle
        const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
        this.ball.dx = (hitPos - 0.5) * 10;
        this.ball.dy = -Math.abs(this.ball.dy);
        this.normalizeBallSpeed(this.ball);
        
        // Paddle recoil effect
        this.paddle.targetRecoil = 8;
        setTimeout(() => { this.paddle.targetRecoil = 0; }, 100);
      }
    }
    
    // Update extra balls (same order as main ball: update -> collisions -> paddle)
    for (let i = this.extraBalls.length - 1; i >= 0; i--) {
      const extraBall = this.extraBalls[i];
      if (!extraBall.active) continue;
      
      // Update position (same as main ball)
      const speedMultiplier = this.deltaTime * 60;
      extraBall.x += extraBall.dx * speedMultiplier;
      extraBall.y += extraBall.dy * speedMultiplier;
      
      // Wall collision (same as main ball)
      if (extraBall.x + extraBall.radius > this.canvas.width || extraBall.x - extraBall.radius < 0) {
        extraBall.dx = -extraBall.dx;
        this.normalizeBallSpeed(extraBall);
      }
      
      // Top collision with nav bar (same as main ball)
      if (extraBall.y - extraBall.radius < this.navHeight) {
        extraBall.y = this.navHeight + extraBall.radius;
        extraBall.dy = -extraBall.dy;
        this.normalizeBallSpeed(extraBall);
      }
      
      // Paddle collision (same as main ball)
      if (
        extraBall.y + extraBall.radius >= this.paddle.y &&
        extraBall.y - extraBall.radius <= this.paddle.y + this.paddle.height &&
        extraBall.x + extraBall.radius >= this.paddle.x &&
        extraBall.x - extraBall.radius <= this.paddle.x + this.paddle.width &&
        extraBall.dy > 0
      ) {
        // Add angle based on where ball hits paddle (same as main ball)
        const hitPos = (extraBall.x - this.paddle.x) / this.paddle.width;
        extraBall.dx = (hitPos - 0.5) * 10;
        extraBall.dy = -Math.abs(extraBall.dy);
        this.normalizeBallSpeed(extraBall);
        
        // Paddle recoil effect
        this.paddle.targetRecoil = 8;
        setTimeout(() => { this.paddle.targetRecoil = 0; }, 100);
      }
      
      // Check if extra ball falls off bottom
      if (extraBall.y - extraBall.radius > this.canvas.height) {
        // Remove this ball
        this.extraBalls.splice(i, 1);
        
        // Check if this was the last ball (no main ball active and no other extra balls)
        const hasActiveBalls = this.ball.active || this.extraBalls.some(b => b.active && b.y - b.radius <= this.canvas.height);
        
        if (!hasActiveBalls && !this.autoScrollTriggered) {
          // This was the last ball - trigger game over
          this.autoScrollTriggered = true;
          this.gameOver = true;
          this.gameStarted = false;
          this.showTryAgain = true;
          this.scrollToContent();
        }
      }
    }
    
    // Ball falls off bottom - only trigger game over if no extra balls remain
    if (this.ball.y - this.ball.radius > this.canvas.height) {
      this.ball.active = false;
      
      // Check if there are any extra balls still active
      const hasActiveBalls = this.extraBalls.some(ball => ball.active && ball.y - ball.radius <= this.canvas.height);
      
      if (!hasActiveBalls && !this.autoScrollTriggered) {
        // No balls left - this was the last ball, game over
        this.autoScrollTriggered = true;
        this.gameOver = true;
        this.gameStarted = false;
        this.showTryAgain = true;
        this.scrollToContent();
      }
    }
    
    this.checkCollision();
  }
  
  scrollToContent() {
    // Complete the scroll to the works section
    const worksSection = document.getElementById('works');
    if (worksSection) {
      worksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  handleClick(e) {
    // Launch ball on canvas click (unless game over)
    if (!this.showTryAgain) {
      this.launchBall();
    }
  }
  
  launchBall() {
    if (!this.ball.active && !this.gameStarted && !this.showTryAgain) {
      this.ball.active = true;
      this.gameStarted = true;
    }
  }
  
  continuePlaying() {
    // Just hide try again button and relaunch ball (keep blocks as they are)
    this.showTryAgain = false;
    this.gameOver = false;
    this.autoScrollTriggered = false;
    
    // Clear extra balls
    this.extraBalls = [];
    
    // Reset ball position on paddle
    this.ball.x = this.paddle.x + this.paddle.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius;
    this.ball.active = false;
    this.gameStarted = false;
    
    // Auto launch after 1.5 seconds
    setTimeout(() => {
      if (!this.ball.active) {
        this.launchBall();
      }
    }, 1500);
  }
  
  resetGame() {
    // Full reset - hide buttons and victory message
    this.showTryAgain = false;
    this.gameOver = false;
    this.autoScrollTriggered = false;
    this.victory = false;
    
    // Hide victory message and play again button
    this.hideVictoryMessage();
    this.hidePlayAgainButton();
    
    // Clear extra balls
    this.extraBalls = [];
    
    // Recreate blocks
    this.createPixelText();
    
    // Reset ball position on paddle
    this.ball.x = this.paddle.x + this.paddle.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius;
    this.ball.active = false;
    this.gameStarted = false;
    
    // Auto launch after 1.5 seconds
    setTimeout(() => {
      if (!this.ball.active) {
        this.launchBall();
      }
    }, 1500);
  }
  
  updateTryAgainButton() {
    const button = document.getElementById('tryAgainButton');
    if (!button) return;
    
    if (this.showTryAgain) {
      // Show and position the button
      const rect = this.canvas.getBoundingClientRect();
      const isMobile = rect.width < 768;
      const buttonY = isMobile ? rect.height / 2 + 140 : rect.height / 2 + 180;
      
      button.style.display = 'block';
      button.style.left = '50%';
      button.style.top = `${buttonY}px`;
      button.style.transform = 'translateX(-50%)';
    } else {
      // Hide the button
      button.style.display = 'none';
    }
  }
  
  animate(currentTime = 0) {
    // Calculate time since last frame (in seconds)
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
    }
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Cap delta time to prevent huge jumps (e.g., when tab is inactive)
    if (this.deltaTime > 0.1) this.deltaTime = 0.1;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBlocks();
    this.drawBall();
    this.drawPaddle();
    this.updateTryAgainButton();
    this.updateBall();
    
    requestAnimationFrame((time) => this.animate(time));
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const gameCanvas = document.getElementById('arkanoidHero');
  if (gameCanvas) {
    new ArkanoidHero('arkanoidHero');
  }
});

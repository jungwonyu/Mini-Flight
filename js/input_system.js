class InputSystem {
  constructor(scene) {
    this.scene = scene;
    this.setupInput();
  }

  setupInput() {
    // 키보드 입력 설정
    cursors = this.scene.input.keyboard.createCursorKeys();

    // 모바일 감지
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
      this.setupTouchInput();
    }
  }

  setupTouchInput() {
    // 터치 다운
    this.scene.input.on('pointerdown', (pointer) => {
      touchTargetX = pointer.x;
      isTouching = true;
    });
    
    // 터치 업
    this.scene.input.on('pointerup', () => {
      isTouching = false;
    });
    
    // 터치 이동
    this.scene.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        touchTargetX = pointer.x;
      }
    });
  }

  handlePlayerMovement() {
    if (isGameOver) return;

    // 키보드 입력 (PC)
    if (cursors.left.isDown) {
      player.x -= GAME_CONSTANTS.PLAYER_MOVE_SPEED;
    } else if (cursors.right.isDown) {
      player.x += GAME_CONSTANTS.PLAYER_MOVE_SPEED;
    }
    
    // 터치 입력 (모바일)
    if (isTouching && isMobile) {
      const distance = touchTargetX - player.x;
      
      if (Math.abs(distance) > 5) { // 5픽셀 이상 차이날 때만 이동
        if (distance > 0) {
          player.x += Math.min(GAME_CONSTANTS.TOUCH_MOVE_SPEED, distance);
        } else {
          player.x += Math.max(-GAME_CONSTANTS.TOUCH_MOVE_SPEED, distance);
        }
      }
    }
    
    // 플레이어 화면 밖 방지
    player.x = Phaser.Math.Clamp(player.x, 30, 450);
  }

  handleWeaponSystem(time) {
    if (isGameOver) return;

    // 더블 총알 타이머 확인
    if (isDoubleBullet && time > doubleBulletEndTime) {
            isDoubleBullet = false;
            if (player && player.active) {
              player.setTexture('player');
            }
    }

    // 자동 발사
    if (time > lastFired) {
      if (isDoubleBullet) {
        this.fireDoubleBullet();
      } else {
        this.fireSingleBullet();
      }
      lastFired = time + GAME_CONSTANTS.FIRE_RATE;
    }
  }

  fireSingleBullet() {
    const bullet = bullets.create(player.x, player.y - 20, 'bullet');
    bullet.setScale(GAME_CONSTANTS.BULLET_SCALE);
    bullet.setVelocityY(GAME_CONSTANTS.BULLET_SPEED);
  }

  fireDoubleBullet() {
    const leftBullet = bullets.create(player.x - 15, player.y - 20, 'bullet');
    leftBullet.setScale(GAME_CONSTANTS.BULLET_SCALE);
    leftBullet.setVelocityY(GAME_CONSTANTS.BULLET_SPEED);
    
    const rightBullet = bullets.create(player.x + 15, player.y - 20, 'bullet');
    rightBullet.setScale(GAME_CONSTANTS.BULLET_SCALE);
    rightBullet.setVelocityY(GAME_CONSTANTS.BULLET_SPEED);
  }
}

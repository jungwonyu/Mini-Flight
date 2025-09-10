// 충돌 처리 시스템

class CollisionSystem {
  // 점수 팝업 표시 (플레이어 위)
  showScorePopup(points) {
    if (!this.scene || !player) return;
    const popup = this.scene.add.text(player.x, player.y - 40, `+${points}`, {
      fontSize: '24px',
      fill: '#fad852ff',
      fontFamily: 'PFStardustS, Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#000',
      strokeThickness: 5
    }).setOrigin(0.5);
    this.scene.tweens.add({
      targets: popup,
      y: player.y - 80,
      alpha: 0,
      duration: 700,
      onComplete: () => popup.destroy()
    });
  }

  // 킹/킹킹 enemy 죽으면 키 드랍
  dropKey(x, y) {
    if (typeof keys === 'undefined' || !keys) {
      keys = this.scene.physics.add.group();
    }
    // 포션과 겹치지 않게 x 위치를 랜덤하게 조정
    const keyX = Phaser.Math.Between(60, 420);
    const keyY = y - Phaser.Math.Between(30, 80); // 포션보다 위쪽에서 시작
    const keyObj = keys.create(keyX, keyY, 'key');
    keyObj.setScale(0.7).setVelocityY(260); // 더 빠른 속도
    keyObj.setDepth(5);
    keyObj.isInventory = false;
    // 반짝임 효과
    this.scene.tweens.add({
      targets: keyObj,
      alpha: 0.5,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    // 회전 효과
    keyObj.setAngularVelocity(180);
    return keyObj;
  }

  // 키와 충돌 시 인벤토리(왼쪽 하단)에 추가
  collectKey(player, keyObj) {
    keyObj.disableBody(true, true);
    // 키 인벤토리 숫자 증가
    if (typeof keyInventoryCount === 'undefined') keyInventoryCount = 0;
    keyInventoryCount++;
    if (typeof keyInventoryText !== 'undefined' && keyInventoryText) {
      keyInventoryText.setText(keyInventoryCount);
    }
  }

  // 포션 수집 시 무적 상태 부여
  collectPotion(player, potion) {
    potion.setAlpha(0.7);
    setTimeout(() => {
      if (potion && potion.active) potion.destroy();
    }, 100);

    isPlayerInvincible = true;
    player.setTexture('player_fever');
    player.anims.play('fly3', true);

    if (this.scene.feverBgm) {
      this.scene.bgm.pause();
      this.scene.feverBgm.play();
    }
    // 피버타임 시작
    isFeverTime = true;
    // 배경을 피버타임용으로 변경
    if (typeof background !== 'undefined' && background && !background.isFever) {
      background.setTexture('bg_fever');
      background.isFever = true;
    }
    // 피버타임 코인 비 효과 시작
    if (this.scene.spawnSystem && typeof this.scene.spawnSystem.startFeverTimeCoinRain === 'function') {
      this.scene.spawnSystem.startFeverTimeCoinRain();
    }

    // 5초 후 무적 해제
    this.scene.time.delayedCall(5000, () => {
      isPlayerInvincible = false;
      isFeverTime = false;
      if (player && player.active) {
        player.setTexture('player');
        player.anims.play('fly', true);
      }
      // 피버타임 종료 시 배경 복구
      if (typeof background !== 'undefined' && background && background.isFever) {
        background.setTexture('bg');
        background.isFever = false;
      }
      // 피버타임 종료 시 화면의 모든 동전 제거
      if (typeof coins !== 'undefined' && coins) {
        coins.children.iterate((coin) => {
          if (coin && coin.active) {
            // '뿅!' 애니메이션: 스케일 업 + 페이드 아웃 후 destroy
            this.scene.tweens.add({
              targets: coin,
              scale: 1.2,
              alpha: 0,
              duration: 250,
              onComplete: () => {
                coin.destroy();
              }
            });
          }
        });
      }

      // 피버사운드 종료
      if (this.scene.feverBgm) {
        this.scene.feverBgm.stop();
        this.scene.bgm.play();
      }
    });
  }

  // 킹/킹킹 enemy가 죽었을 때 포션 드랍 (한 번만)
  dropPotion(x, y) {
    // 이미 화면에 포션이 있으면 드랍하지 않음
    let activePotions = 0;
    if (typeof potions !== 'undefined' && potions) {
      potions.children.iterate((potion) => {
        if (potion && potion.active) activePotions++;
      });
    }
    if (activePotions > 0) return;
    // 포션 그룹이 없으면 생성
    if (typeof potions === 'undefined' || !potions) {
      potions = this.scene.physics.add.group();
    }
  const potion = potions.create(x, y, 'potion');
    potion.setScale(0.6);
    potion.setVelocityY(120);
    // 반짝임 효과
    this.scene.tweens.add({
      targets: potion,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    // 회전 효과
    potion.setAngularVelocity(360);
  }

  // 적 체력바 업데이트 공통 함수
  getEnemyConfig(enemyType) {
    const configs = {
      'normal': {
        healthBarWidth: 60,
        tintColor: GAME_COLORS.NORMAL_ENEMY,
        baseScale: 0.6,
        scaleMultiplier: 0.4,
        coinDrop: 1,
        destroyScore: 5,
        hitScore: 2
      },

      'king': {
        healthBarWidth: 100,
        tintColor: GAME_COLORS.KING_ENEMY,
        baseScale: 0.6,
        scaleMultiplier: 0.4,
        coinDrop: 5,
        destroyScore: 100,
        hitScore: 5
      },

      'kingking': {
        healthBarWidth: 150,
        tintColor: GAME_COLORS.KING_KING_ENEMY,
        baseScale: 0.6,
        scaleMultiplier: 0.4,
        coinDrop: 10,
        destroyScore: 300,
        hitScore: 8
      }
    };
    return configs[enemyType];
  }
  
  constructor(scene) {
    this.scene = scene;
  }

  // 공통 적 충돌 처리
  hitEnemyCommon(bullet, enemy, enemyType) {
    bullet.destroy();
    enemy.health--;
    
    const config = this.getEnemyConfig(enemyType);
    
    // 체력바 업데이트
    this.updateHealthBar(enemy, config.healthBarWidth);
    
    // 타격 효과
    this.createHitEffect(enemy, config.tintColor);

    // 적 피격 효과음 재생
    if (this.scene.enemyHitSound) this.scene.enemyHitSound.play();
    
    // 체력에 따라 크기 조정
    const healthRatio = enemy.health / enemy.maxHealth;

    enemy.setScale(config.baseScale + (healthRatio * config.scaleMultiplier));
    
    if (enemy.health <= 0) {
      this.destroyEnemy(enemy, config.coinDrop, config.destroyScore);
    } else {
      this.updateScore(config.hitScore);
    }
  }

  // 일반 적과 총알 충돌
  hitEnemy(bullet, enemy) {
    this.hitEnemyCommon(bullet, enemy, 'normal');
  }

  // 킹 에너미와 총알 충돌
  hitKingEnemy(bullet, kingEnemy) {
    this.hitEnemyCommon(bullet, kingEnemy, 'king');
  }

  // 킹킹 에너미와 총알 충돌
  hitKingKingEnemy(bullet, kingKingEnemy) {
    this.hitEnemyCommon(bullet, kingKingEnemy, 'kingking');
  }

  // 점수 업데이트 공통 함수
  updateScore(points) {
    score += points;
    // document.getElementById('score').innerText = score;
    // document.getElementById('gameOverCount').innerText = gameOverCount;

    // if (typeof scoreText !== 'undefined' && scoreText) {
    //   scoreText.setText('Score: ' + score);
    // }

    // if (typeof gameOverCountText !== 'undefined' && gameOverCountText) {
    //   gameOverCountText.setText('Game Over Count: ' + gameOverCount);
    // }

    this.showScorePopup(points);
  }

  // 동전 수집
  collectCoin(player, coin) {
    coin.setAlpha(0.7);

    setTimeout(() => {
      if (coin && coin.active) {
        coin.destroy();
      }
    }, 100);
    
    this.updateScore(10);
    // 효과음 재생
    if (this.scene.coinSound) this.scene.coinSound.play();
  }

  // 파워업 수집
  collectPowerup(player, powerup) {
    powerup.setScale(0.8).setTint(GAME_COLORS.POWERUP_EFFECT);
    
    // 더블 총알 활성화
    isDoubleBullet = true;
    doubleBulletEndTime = this.scene.time.now + GAME_CONSTANTS.POWERUP_DURATION;
    
    // 파워업 폭발 효과
    this.scene.tweens.add({
      targets: powerup,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        powerup.destroy();
      }
    });
    
    // 플레이어 이미지 변경 (player_double)
    player.setTexture('player_double');
    player.anims.play('fly2', true);

    this.scene.time.delayedCall(GAME_CONSTANTS.POWERUP_DURATION, () => {
      isDoubleBullet = false;
      if (player && player.active) {
        player.setTexture('player');
        player.anims.play('fly', true);
      }
    });
        
    this.updateScore(10);
    // 효과음 재생
    if (this.scene.powerupSound) this.scene.powerupSound.play();
  }

  // 적 체력바 제거 공통 함수
  removeEnemyHealthBar(enemy) {
    if (enemy.healthBarBg) enemy.healthBarBg.destroy();
    if (enemy.healthBarFill) enemy.healthBarFill.destroy();
  }

  // 플레이어 충돌 (적과)
  playerHit(player, enemy) {
    if (typeof isPlayerInvincible !== 'undefined' && isPlayerInvincible) {
      // 무적 상태면 적만 제거, 플레이어는 영향 없음
      enemy.destroy();
      this.removeEnemyHealthBar(enemy);
      return;
    }
    enemy.destroy();
    this.removeEnemyHealthBar(enemy);
    this.gameOver(player);
  }

  // 플레이어 총알 충돌
  playerHitByBullet(player, enemyBullet) {
    if (typeof isPlayerInvincible !== 'undefined' && isPlayerInvincible) {
      // 무적 상태면 총알만 제거, 플레이어는 영향 없음
      enemyBullet.destroy();
      return;
    }
    enemyBullet.destroy();
    this.gameOver(player);
  }

  // 게임 오버 처리
  gameOver(player) {
    // 기록은 유지, 물리 pause만 하고 UI 숨김 및 팝업만 띄움
    isGameOver = true;
    gameState = 'gameover';
    gameOverCount++;

    this.scene.gameOverCountText.setText(gameOverCount);
    this.scene.physics.pause();
    player.setTint(GAME_COLORS.GAME_OVER);

    // 진동 효과
    this.scene.cameras.main.shake(300, 0.015);

    // HTML 게임 오버 화면 표시
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverInfo = document.getElementById('gameOverInfo');
    const startScreen = document.getElementById('startScreen');
    const finalOverScreen = document.getElementById('finalOverScreen');
    const restartButtons = document.querySelectorAll('.restartButton');
    const retryButtons = document.querySelectorAll('.retryButton');

    // 퀴즈 화면
    const quizScreen = document.getElementById('quizScreen');
    const gameScreen = document.getElementById('gameScreen');
    const submitButton = document.getElementById('submitButton');
    const questionElement = quizScreen.querySelector('.question');
    const quizImageElement = quizScreen.querySelector('.quizImage');
    const answerElement = quizScreen.querySelector('.userAnswer input');

    // 오답 화면
    const wrongAnswerScreen = document.getElementById('wrongAnswerScreen');
    const wrongAnswerInfo = document.getElementById('wrongAnswerInfo');

    let quizData = [];

    fetch('data/quiz.json')
      .then(response => response.json())
      .then(data => {
        quizData = data; // 퀴즈 데이터 저장
      })
      .catch(error => {
        console.error('퀴즈 데이터 로드 실패:', error);
      });

    if (gameOverScreen && gameOverInfo && restartButtons && retryButtons) {
      gameOverInfo.innerHTML = `Final Score: <b>${score}</b><br>Distance: <b>${Math.floor(distance / 10)}m</b>`;
      gameOverScreen.classList.remove('hidden');

      // 다시하기 버튼 이벤트 연결 (중복 방지)
      restartButtons.forEach(btn => {
        btn.onclick = () => {
          if (this.scene.gameOverBgm) this.scene.gameOverBgm.stop();
          if (this.scene.buttonSound) this.scene.buttonSound.play();
          gameScreen.classList.add('hidden');
          wrongAnswerScreen.classList.add('hidden');
          gameOverScreen.classList.add('hidden');
          finalOverScreen.classList.add('hidden');
          startScreen.classList.remove('hidden');
          gameOverCount = 0;
          this.scene.scene.restart();
        };
      });

      // 이어서 하기
      retryButtons.forEach(btn => {
        btn.onclick = () => {
          if (this.scene.gameOverBgm) this.scene.gameOverBgm.stop();
          if (this.scene.buttonSound) this.scene.buttonSound.play();
          if (typeof keyInventoryCount === 'undefined') keyInventoryCount = 0;
          if (keyInventoryCount < gameOverCount) {
            quizScreen.classList.add('hidden');
            wrongAnswerScreen.classList.add('hidden');
            finalOverScreen.classList.remove('hidden');
            return;
          }
          keyInventoryCount -= gameOverCount;
          if (typeof keyInventoryText !== 'undefined' && keyInventoryText) {
            keyInventoryText.setText(keyInventoryCount);
          }

          // 문제 풀이 화면 보여주기
          wrongAnswerScreen.classList.add('hidden');
          quizScreen.classList.remove('hidden');

          // 퀴즈와 정답 넣기
          answerElement.value = '';
          const randomNum = Phaser.Math.Between(0, quizData.length - 1);
          const randomQuiz = quizData[randomNum];
          questionElement.textContent = randomQuiz.question; // 랜덤 문제 보여주기
          quizImageElement.style.backgroundImage = `url(${randomQuiz.image})`; // 이미지 설정
          answerElement.setAttribute('data-answer', randomQuiz.answer); // 정답 저장
        };
      });

      submitButton.onclick = () => {
        if (this.scene.buttonSound) this.scene.buttonSound.play();
        // 정답 체크
        const userAnswer = answerElement.value;

        if (userAnswer === answerElement.getAttribute('data-answer')) { // 정답인 경우
          const countdownBox = document.getElementById('countdownBox');
          const countdownText = document.getElementById('countdownText');
          if (countdownBox && countdownText) {
            gameOverScreen.classList.add('hidden');
            countdownBox.classList.remove('hidden');
            
            if (this.scene.successSound) this.scene.successSound.play();

            let count = 3;
            countdownText.textContent = count;
            const countdownInterval = setInterval(() => {
              count--;
              if (count > 0) {
                countdownText.textContent = count;
              } else {
                clearInterval(countdownInterval);
                countdownBox.classList.add('hidden');

                // 게임 이어서 진행
                isGameOver = false;
                gameState = 'playing';
                this.scene.physics.resume();

                if (typeof player !== 'undefined' && player) {
                  player.setVisible(true);
                  player.clearTint();
                }

                // 화면에 있는 모든 적 제거
                if (typeof enemies !== 'undefined' && enemies) {
                  enemies.children.iterate((enemy) => {
                    if (enemy && enemy.active) {
                      if (typeof this.removeEnemyHealthBar === 'function') this.removeEnemyHealthBar(enemy);
                      enemy.destroy();
                    }
                  });
                }
                if (typeof kingEnemies !== 'undefined' && kingEnemies) {
                  kingEnemies.children.iterate((enemy) => {
                    if (enemy && enemy.active) {
                      if (typeof this.removeEnemyHealthBar === 'function') this.removeEnemyHealthBar(enemy);
                      enemy.destroy();
                    }
                  });
                }
                if (typeof kingKingEnemies !== 'undefined' && kingKingEnemies) {
                  kingKingEnemies.children.iterate((enemy) => {
                    if (enemy && enemy.active) {
                      if (typeof this.removeEnemyHealthBar === 'function') this.removeEnemyHealthBar(enemy);
                      enemy.destroy();
                    }
                  });
                }
                // 1초 후 적 스폰 재개
                setTimeout(() => {
                  if (this.scene.spawnSystem && typeof this.scene.spawnSystem.resumeSpawning === 'function') {
                    this.scene.spawnSystem.resumeSpawning();
                  }
                  if (this.scene.bgm && typeof this.scene.bgm.play === 'function') {
                    this.scene.bgm.play();
                  }
                }, 300);
              }
            }, 1000);
          }
        } else { // 오답인 경우
          if (this.scene.failSound) this.scene.failSound.play();
          gameOverScreen.classList.add('hidden');
          wrongAnswerScreen.classList.remove('hidden');
          wrongAnswerInfo.innerHTML = `Final Score: <b>${score}</b><br>Distance: <b>${Math.floor(distance / 10)}m</b>`;
        }

        quizScreen.classList.add('hidden');
      };
    }
    
    if (this.scene.gameOverBgm) this.scene.gameOverBgm.play(); // 게임 오버 효과음 재생
    if (this.scene.bgm && this.scene.bgm.isPlaying) this.scene.bgm.stop(); // 배경음악 정지
  }

  // 체력바 업데이트
  updateHealthBar(enemy, maxWidth) {
    if (enemy.healthBarFill) {
      const healthRatio = enemy.health / enemy.maxHealth;
      enemy.healthBarFill.width = maxWidth * healthRatio;
      
      // 체력에 따라 색상 변경
      if (healthRatio > 0.6) {
        enemy.healthBarFill.fillColor = GAME_COLORS.HEALTH_HIGH;
      } else if (healthRatio > 0.3) {
        enemy.healthBarFill.fillColor = GAME_COLORS.HEALTH_MEDIUM;
      } else {
        enemy.healthBarFill.fillColor = GAME_COLORS.HEALTH_LOW;
      }
    }
  }

  // 타격 효과
  createHitEffect(enemy, originalTint) {
    enemy.setTint(GAME_COLORS.HIT_EFFECT);
    setTimeout(() => {
      if (enemy && enemy.active) {
        enemy.setTint(originalTint);
      }
    }, 100);
  }

  // 에너미 제거 및 동전 드랍
  destroyEnemy(enemy, coinCount, scoreValue) {
    // 체력바 제거
    this.removeEnemyHealthBar(enemy);

    // 동전 드랍
    this.dropCoins(enemy.x, enemy.y, coinCount);

    // 킹 enemy 또는 킹킹 enemy일 때 포션 드랍 + 키 드랍 (한 번만)
    if (enemy.texture && (enemy.texture.key === 'king_enemy' || enemy.texture.key === 'king_king_enemy')) {
      this.dropPotion(enemy.x, enemy.y);
      this.dropKey(enemy.x, enemy.y);
    }

    this.updateScore(scoreValue);
    enemy.destroy();
    // 효과음 재생
    if (this.scene.explosionSound) this.scene.explosionSound.play();
  }

  // 동전 드랍 공통 함수
  dropCoins(x, y, coinCount) {
    for (let i = 0; i < coinCount; i++) {
      const coin = coins.create( x + Phaser.Math.Between(-40, 40), y + Phaser.Math.Between(-30, 30), 'coin');
      coin.setScale(0.7).setVelocityY(200).setVelocityX(Phaser.Math.Between(-120, 120)); // 코인 크기 증가
      coin.coinRotation = 0;
    }
  }
}
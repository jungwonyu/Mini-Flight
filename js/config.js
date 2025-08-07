// 게임 설정 및 전역 변수들

// Phaser 게임 설정
const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 568
    },
    max: {
      width: 480,
      height: 800
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: {
    preload: function() { preload.call(this); },
    create: function() { create.call(this); },
    update: function(time) { update.call(this, time); }
  }
};

// 전역 게임 오브젝트들
let player;
let bullets;
let enemies;
let kingEnemies; 
let kingKingEnemies;
let enemyBullets;
let coins;
let powerups;
let background;
let cursors;
let warningOverlay;
let gameOverText;
let restartButton;

// 게임 상태 변수들
let score = 0;
let distance = 0;
let lastKingSpawn = 0;
let lastKingKingSpawn = 0;
let lastFired = 0;
let isGameOver = false;
let gameState = 'start'; // 'start', 'playing', 'gameover'

// 파워업 관련 변수들
let isDoubleBullet = false;
let doubleBulletEndTime = 0;

// UI 텍스트 요소들
let scoreText;
let distanceText;

// 모바일 터치 컨트롤 변수들
let isMobile = false;
let touchTargetX = 0;
let isTouching = false;

// 게임 상수들
const GAME_CONSTANTS = {
  PLAYER_MOVE_SPEED: 5,
  TOUCH_MOVE_SPEED: 8,
  BULLET_SPEED: -300,
  BULLET_SCALE: 1.5,
  FIRE_RATE: 250,
  KING_SPAWN_DISTANCE: 200,
  KING_KING_SPAWN_DISTANCE: 500,
  POWERUP_DURATION: 5000,

  // 파워업 스폰 설정
  POWERUP_MIN_SPAWN_TIME: 8000,   // 최소 8초
  POWERUP_MAX_SPAWN_TIME: 15000,  // 최대 15초 (기존 15-25초에서 단축)
  POWERUP_FIRST_SPAWN_DELAY: 5000, // 첫 파워업 5초 후 (기존 10초에서 단축)

  // 적 체력 설정
  ENEMY_HEALTH: 2,
  KING_ENEMY_HEALTH: 10,
  KING_KING_ENEMY_HEALTH: 20,
  
  // 보스 총알 발사 설정
  KING_FIRE_RATE: 2000,        // 킹 에너미 2초마다 발사
  KING_KING_FIRE_RATE: 2500,   // 킹킹 에너미 2초마다 발사
  KING_BULLET_SPEED: 200,      // 킹 에너미 총알 속도
  KING_KING_BULLET_SPEED: 200  // 킹킹 에너미 총알 속도
};

// 게임 색상 상수들
const GAME_COLORS = {
  WHITE: 0xffffff,
  RED: 0xff0000,
  ORANGE: 0xff6600,
  GREEN: 0x00ff00,
  YELLOW: 0xffff00,
  BLACK: 0x000000,
  
  // 적 타입별 색상
  NORMAL_ENEMY: 0xffffff,
  KING_ENEMY: 0xff6600,
  KING_KING_ENEMY: 0xff0000,
  
  // 체력바 색상
  HEALTH_HIGH: 0x00ff00,    // 초록색 (60% 이상)
  HEALTH_MEDIUM: 0xffff00,  // 노란색 (30-60%)
  HEALTH_LOW: 0xff0000,     // 빨간색 (30% 이하)
  
  // 효과 색상
  HIT_EFFECT: 0xffffff,
  POWERUP_EFFECT: 0xffffff,
  PLAYER_POWERUP: 0x00ff00,
  GAME_OVER: 0xff0000
};
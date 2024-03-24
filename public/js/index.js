const app = Vue.createApp({
  data() {
    return {
      overlayDisplay: 'none',
      overlayAnimation: '',
      closeBtnId: 5,
      close_button: '确定(5秒)',
      cardModalId: 0,
      data_data: '',
      cardModalContent: `<button class="close-button" @click="closeModal"><span class="close-span"><strong>╳</strong></span></button><h3>第一步</h3><input type="text" placeholder="请输入卡密" v-model="cardInputValue"><button id="next-btn" @click="handleNext">下一步</button>`,
      cardModalDisplay: 'none',
      cardModalAnimation: '',
      cardInputValue: '',
      alertId: 0,
    };
  },
  mounted() {
    // 获取并检查 isgong.json 文件内容
    fetch('/src/isgong.json')
      .then(response => response.json())
      .then(data => {
        if (data.message && data.type) {
          this.alertMessage(data.message, data.type);
        }
      })
      .catch(error => {
        console.error(error);
      });

    // 检查用户的 cookies
    const userCookie = this.getCookie('user');
    if (!userCookie || userCookie === '') {
      this.setCookie('user', 'Pat.use');
    }
  },
  methods: {
    start() {
      this.overlayDisplay = 'flex';
      this.overlayAnimation = 'fade-in 0.5s forwards';
      this.cardModalDisplay = 'block';
      this.cardModalAnimation = 'slide-in 0.5s forwards';
    },
    closeModal() {
      this.overlayAnimation = 'fade-out-a 0.5s forwards';
      this.cardModalAnimation = 'slide-out-a 0.5s forwards';
      setTimeout(() => {
        this.overlayDisplay = 'none';
        this.cardModalDisplay = 'none';
        this.cardInputValue = '';
        this.cardModalId = 0;
      }, 500);
    },
handleNext() {
  const cardModal = document.querySelector('.card-modal');
  const card = this.cardInputValue.trim();
  if (!card) {
    this.alertMessage('请输入有效的卡密', 'error');
    return;
  }

  const userCookie = this.getCookie('user');

      fetch('/api/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card, use: userCookie }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.status === 200) {
            this.cardModalId = 1;
            this.data_data = data.data;
      this.alertMessage('激活成功', 'info');
      this.startTimer(5);
    } else if (data.status === 500) {
      this.alertMessage('检测到服务器出错，请联系管理员解决', 'error');
    } else {
      this.alertMessage(data.data, 'error');
    }
  })
  .catch(error => {
    console.error(error);
    this.alertMessage('请求失败，请联系管理员解决', 'error');
  });
  },
    startTimer(time) {
      this.closeBtnId = time;
      const button = document.querySelector('.card-modal .close-Btn');
      this.close_button = `确定(${time}秒)`;
      const timerId =setInterval(() => {
  time--;
  this.closeBtnId = time;
  this.close_button = `确定(${time}秒)`;
  if (time === 0) {
    clearInterval(timerId);
    this.closeBtnId = 0;
    this.close_button = '确定';
  }
}, 1000);
},
    alertMessage(message, type) {
      this.alertId++;
      const newAlert = document.createElement('div');
      newAlert.className = `alert show el-message--${type} slide-down`;
      newAlert.innerHTML = `
        <i class="el-icon__${type}"></i>
        <span>${message}</span>`;
      newAlert.setAttribute('data-id', this.alertId);
      const existingAlerts = document.querySelectorAll('.alert.show');
      let newOffsetTop;

      if (existingAlerts.length > 0) {
        const lastAlert = existingAlerts[existingAlerts.length - 1];
        const lastAlertTop = parseInt(lastAlert.style.top);
        newOffsetTop = lastAlertTop + 45;
        newAlert.style.top = `${newOffsetTop}px`;
      } else {
        newOffsetTop = 50;
        newAlert.style.top = `${newOffsetTop}px`
              }

      document.body.appendChild(newAlert);
      const delayTimeoutId = setTimeout(() => {
        clearTimeout(delayTimeoutId);
        newAlert.style.animation = 'slide-out 0.5s forwards';
        const removeTimeoutId = setTimeout(() => {
          clearTimeout(removeTimeoutId);
          newAlert.remove();
          this.updatePositions();
        }, 500);
      }, 2000);

      newAlert.style.animation = 'slide-down 0.5s forwards';

      const previousAlert = existingAlerts[existingAlerts.length - 1];
      if (previousAlert) {
        previousAlert.addEventListener('animationend', () => {
          newAlert.style.top = `${newOffsetTop}px`;
        });
      }
    },
    updatePositions() {
      const alerts = document.querySelectorAll('.alert.show');
      const spacing = 45;
      for (let i = 0; i < alerts.length; i++) {
        const alert = alerts[i];
        const topOffset = i * spacing + 50;
        const alertId = parseInt(alert.getAttribute('data-id'));
        if (alertId <= alertId) {
          if (parseInt(alert.style.top) !== topOffset) {
            alert.style.transition = 'slide-out 800ms ease-in-out';
            alert.style.top = `${topOffset}px`;
          }
        }
      }
    },
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    },
    setCookie(name, value, days) {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
      }
      document.cookie = `${name}=${value || ''}${expires}; path=/`;
    },
  },
});

app.mount('#app');

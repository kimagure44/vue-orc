<template>
  <div id="app">
    <div class="container information">
      The image that is being uploaded is never sent anywhere.<br />
      Character recognition (OCR) is done in the browser itself.<br />
      All operations carried out by this application are local.
    </div>
    <div class="container button-group">
      <div class="row">
        <button
          v-on:click="recognize"
          :class="['primary', readyOCR && selectedLang !== 0 ? '' : 'disabled']"
        >
          OCR
        </button>
      </div>
      <div class="row">
        <button
          :class="['primary', { disabled: !readyUpload }]"
          @click="upload"
        >
          Load image
        </button>
      </div>
      <div class="row">
        <select v-model="selectedLang" class="primary">
          <option :value="0">Select language to recognize</option>
          <option
            v-for="(lang, index) in languages"
            :key="`lang-${lang}-${index}`"
          >
            {{ lang }}
          </option>
        </select>
      </div>
    </div>
    <div class="container">
      <div class="row">
        <img
          id="text-img"
          :src="image"
          v-if="showImage"
          ref="image"
          :class="[{ loading: showProgress }]"
        />
      </div>
    </div>
    <div class="container">
      <div class="row">
        <progress :value="progress" max="100" v-if="showProgress">
          {{ progress }} %
        </progress>
        <div class="log" v-if="showProgress">
          <div
            v-for="{ phase, status, time } in log"
            :key="`item-${phase}-${status}`"
          >
            <div class="item">[{{ time }}]: {{ phase }}..... {{ status }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="container result" v-if="text">
      <div class="row">
        <div v-text="text"></div>
      </div>
    </div>
    <input type="file" accept="image/*" @change="setFile" ref="file" />
  </div>
</template>

<script>
import { createWorker, PSM, OEM, languages } from "tesseract.js";

export default {
  name: "vue-ocr",
  data() {
    return {
      image: null,
      readyOCR: false,
      readyUpload: true,
      showImage: false,
      showProgress: false,
      progress: 0,
      work: null,
      text: "",
      log: [],
      languages,
      selectedLang: 0,
    };
  },
  methods: {
    getTime() {
      const options = {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      };
      return new Intl.DateTimeFormat("es-Es", options).format(new Date());
    },
    upload() {
      this.$refs.file.click();
    },
    setFile(event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.image = reader.result;
        this.showImage = true;
        this.readyOCR = true;
      };
      reader.readAsDataURL(file);
    },
    isBussy(status) {
      this.showProgress = status;
      this.readyOCR = !status;
      this.readyUpload = !status;
    },
    async recognize() {
      this.isBussy(true);
      await this.work.load();
      await this.work.loadLanguage(this.selectedLang);
      await this.work.initialize(this.selectedLang, OEM.LSTM_ONLY);
      await this.work.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      const {
        data: { text },
      } = await this.work.recognize(this.$refs.image);
      this.text = text;
      this.isBussy(false);
      this.log = [];
    },
    saveLog({ status, progress }) {
      this.log.push({
        time: this.getTime(),
        phase: status,
        status: progress === 0 ? "Start" : "End",
      });
    },
    worker() {
      this.work = createWorker({
        logger: (data) => {
          if (data.status === "recognizing text") {
            this.progress = data.progress * 100;
            data.progress === 1 || (data.progress === 0 && this.saveLog(data));
          } else {
            this.saveLog(data);
          }
        },
      });
    },
  },
  mounted() {
    this.worker();
  },
};
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Montserrat&display=swap");

$blue-dark: #095dcd;
$blue-light: #00a8ff;
$black: #000000;
$gray: #808080;
$green: #00dd00;
$white: #ffffff;
$shadow: 0px 3px 9px 0px rgb(0, 0, 0, 0.4);

@media all and (max-width: 500px) {
  .button-group {
    align-items: center;
    display: flex;
    flex-direction: column;
  }
}
button,
select {
  border: 0;
  cursor: pointer;
  font-family: "Montserrat", sans-serif;
  box-shadow: $shadow;
  padding: 5px 15px;
  transition: ease-in-out 150ms;
  &:active {
    background: $blue-dark;
    box-shadow: $shadow;
  }
}
input[type="file"] {
  display: none;
  left: 0;
  position: absolute;
  top: 0;
}
img {
  box-shadow: $shadow;
  height: auto;
  width: 300px;
}
progress {
  height: 30px;
  left: calc(50% - 75px);
  position: relative;
  width: 150px;
}
#app {
  align-items: center;
  display: flex;
  flex-direction: column;
  font-family: "Montserrat", sans-serif;
  justify-content: center;
  min-width: 300px;
}
.log {
  background: $black;
  box-shadow: $shadow;
  color: $green;
  font-size: 10px;
  height: 100px;
  left: calc(50% - 160px);
  overflow: auto;
  padding: 10px;
  position: relative;
  width: 300px;
  .item {
    margin-bottom: 10px;
  }
}
.container {
  display: flex;
  .row {
    margin: 10px;
  }
}
.primary {
  background: $blue-light;
  color: $white;
}
.disabled {
  background: $gray !important;
  opacity: 0.3;
  pointer-events: none;
}
.loading {
  opacity: 0.1;
}
.result {
  box-shadow: $shadow;
  margin: 10px;
}
.information {
  margin: 20px 0;
  text-align: center;
}
</style>

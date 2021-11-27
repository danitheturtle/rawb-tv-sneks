export class Background {
  constructor(_name) {
    this.ready = false;
    this.img = undefined;
    this.name = _name;
    this.width = 0;
    this.height = 0;
    this.whRatio = undefined;
    this.hwRatio = undefined;
    this.parallaxSpeed = [-0.5, -0.4];
  }
  
  load() {
    const back = this;
    return new Promise((res, rej) => {
      try {
        //Load the Image
        back.img = new Image();
        back.img.onload = () => {
          //Set the sheet to ready
          back.ready = true;
          //Get the height/width of the source image
          back.width = back.img.width;
          back.height = back.img.height;
          //Get ratios so we can keep them constant
          back.whRatio = back.width / back.height;
          back.hwRatio = back.height / back.width;
          //Resolve the promise once loaded
          res(back);
        }
        back.img.src = "../public/assets/backgrounds/" + back.name;
      } catch (e) {
        rej(e);
      }
    })
  }
}

export class Background {
  constructor(_name, _imageSrc, _data) {
    this.ready = false;
    this.src = _imageSrc;
    this.image = undefined;
    this.name = _name;
    this.parallaxSpeed = [-0.5, -0.4];
  }

  load() {
    return new Promise((res, rej) => {
      try {
        //Load the Image
        this.image = new Image();
        this.image.onload = () => {
          //Set the sheet to ready
          this.ready = true;
          //Get the height/width of the source image
          this.width = this.image.width;
          this.height = this.image.height;
          //Get ratios so we can keep them constant
          this.whRatio = this.width / this.height;
          this.hwRatio = this.height / this.width;
          //Resolve the promise once loaded
          res(this);
        }
        this.image.src = this.src;
      } catch (error) {
        rej(error);
      }
    }).catch(err => {
      console.err(err);
    });
  }
}

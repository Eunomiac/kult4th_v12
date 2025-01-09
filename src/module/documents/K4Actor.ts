export default class K4Actor extends Actor {

  testMethod(this: K4Actor) {
    gsap.to(this, {
      x: 100,
      duration: 1
    });
    const test = new SplitText(this.name);
    console.log(test.words);
  }

}

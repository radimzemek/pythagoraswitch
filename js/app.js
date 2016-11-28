console.log("app.js");

'use strict';

window.addEventListener('load', function() {
  //UI elements displayig sensor values
  var temperature_sensor_value = document.querySelector('.temperature_sensor_value');
  var distance_sensor_value = document.querySelector('.distance_sensor_value');
  var light_sensor_value = document.querySelector('.light_sensor_value');

  //sensors
  var adt7410;  //temperature sensor
  var groveLight; //light sensor
  var srf02;  //ultrasound distance sensor

  //actuators
  var umbrellaPort1, umbrellaPort2; //umbrella
  var waterPumpPort;  //water pump
  var servo;  //servos
  var pcs9685;  //servo driver

  var servoFlag=false;

  //UI
  var umbrellaButtonOverride = false; //umbrella switch
  var waterPumpButtonOverride = false;  //water pump switch
  var robotArmButtonOverride = false; //robot arm switch
  $(".glyphicons-ruler").css('color', 'orange');
  $(".glyphicons-temperature").css('color', 'orange');
  $(".glyphicons-brightness-reduce").css('color', 'orange');
  
  //umberlla switch
  $(".switch#umbrella").click(function() {
    umbrellaButtonOverride = true;
    $("#umbrella .glyphicons-power").css('color', 'orange');
    $(".glyphicons-ruler").css('color', 'black');
    console.log("umbrellaButtonOverride: " + umbrellaButtonOverride);
    if ($(".umbrella span").css('color') === 'rgb(255, 0, 0)') {
      umbrella(1);
    }
    else {
      umbrella(0);
    }
  });
  
  $(".distance_sensor .glyphicons").click(function() {
    umbrellaButtonOverride = false;
    $(".glyphicons-ruler").css('color', 'orange');
    $("#umbrella .glyphicons-power").css('color', 'black');
    console.log("umbrellaButtonOverride: " + umbrellaButtonOverride);
  });

  //water pump switch
  $(".switch#water_pump").click(function() {
    waterPumpButtonOverride = true;
    $("#water_pump .glyphicons-power").css('color', 'orange');
    $(".glyphicons-temperature").css('color', 'black');
    console.log("waterPumpButtonOverride: " + waterPumpButtonOverride);
    if ($(".water_pump span").css('color') === 'rgb(255, 0, 0)') {
      waterPump(1);
    }
    else {
      waterPump(0);
    }
  });

  $(".temperature_sensor .glyphicons").click(function() {
    waterPumpButtonOverride = false;
    $(".glyphicons-temperature").css('color', 'orange');
    $("#water_pump .glyphicons-power").css('color', 'black');
    console.log("waterPumpButtonOverride: " + waterPumpButtonOverride);
  });

  //robot arm switch
  $(".switch#robot_arm").click(function() {
    robotArmButtonOverride = true;
    $("#robot_arm .glyphicons-power").css('color', 'orange');
    $(".glyphicons-brightness-reduce").css('color', 'black');
    console.log("robotArmButtonOverride: " + robotArmButtonOverride);
    if ($(".robot_arm span").css('color') === 'rgb(255, 0, 0)') {
      robotArm(true);
    }
    else {
      robotArm(false);
    }
  });

  $(".light_sensor .glyphicons").click(function() {
    robotArmButtonOverride = false;
    $(".glyphicons-brightness-reduce").css('color', 'orange');
    $("#robot_arm .glyphicons-power").css('color', 'black');
    console.log("robotArmButtonOverride: " + robotArmButtonOverride);
  });


  // WebI2C init
  navigator.requestI2CAccess().then(i2cAccess => {
    var port = i2cAccess.ports.get(0);
    adt7410 = new ADT7410(port, 0x48);
    groveLight = new GROVELIGHT(port, 0x29);
    srf02 = new SRF02(port, 0x70);
    pcs9685 = new PCA9685(port, 0x40);

    //I2C devices init
    pcs9685.init(0.0015, 0.0006, 50, true).then(function() {
      servo = new SERVO(pcs9685);
      groveLight.init().then(function() {
        // sensor read 
        setInterval(function() {
          if(!servoFlag) {

            groveLight.read().then(function(value) {
              console.log("light: ", value);
              light_sensor_value.innerHTML = value + " lux";
              if (!robotArmButtonOverride) {
                ifThen(value, $(".light_sensor select").val(), $(".light_sensor input").val(), robotArm);
              }
              
              adt7410.read().then(function(value) {
                console.log("temperature: ", value);
                temperature_sensor_value.innerHTML = value + " &#x2103";
                if (!waterPumpButtonOverride) {
                  ifThen(value, $(".temperature_sensor select").val(), $(".temperature_sensor input").val(), waterPump);
                }
                
                srf02.read().then(function(value) {
                  console.log("ultrasound: ", value);
                  distance_sensor_value.innerHTML = value + "";
                  if (!umbrellaButtonOverride) {
                    ifThen(value, $(".distance_sensor select").val(), $(".distance_sensor input").val(), umbrella);
                  }
                });
              });
            });
          }
        }, 5000);
      });
    });
  }).catch(e => console.error("error: ", e));

  function umbrella(value) {
    servoFlag = true;
    console.log("umbrella(" + value + ")");
    if (value) {
      servo.umbrellaOn().then(function() {
        servoFlag = false;
      });
      $(".umbrella span").css("color", "green");
    }
    else {
      servo.umbrellaOff().then(function() {
        servoFlag = false;
      });
      $(".umbrella span").css("color", "red");
    }
  }

  function waterPump(value) {
    servoFlag = true;
    console.log("waterPump(" + value + ")");
    if (value) {
      servo.waterOn().then(function() {
        servoFlag = false;
      });
      $(".water_pump span").css("color", "green");
    }
    else {
      servo.waterOff().then(function() {
        servoFlag = false;
      });
      $(".water_pump span").css("color", "red");
    }
  }

  function robotArm(value) {
    servoFlag = true;
    console.log("robotArm(" + value + ")");
    if (value && $(".robot_arm span").css('color') === 'rgb(255, 0, 0)') {
      servo.initPosition().then(function() {
        servo.switchOn().then(function() {
          servoFlag = false;
        });
      });
      $(".robot_arm span").css("color", "green");
    }
    else if (!value && $(".robot_arm span").css('color') != 'rgb(255, 0, 0)') {
      servo.initPosition().then(function() {
        servo.switchOff().then(function() {
          servoFlag = false;
        });
      });
      $(".robot_arm span").css("color", "red");
    }else{
      servoFlag = false;
    }
  }

}, false);


function SERVO(servo) {
  this.servo = servo;
}

SERVO.prototype = {
  setServo:function (ch,angle,generator){
    this.servo.setServo(ch,angle).then(function(){
      console.log("servo value: ", ch, angle);
      generator.next();
    });
  },
  sleep:function (ms, generator){
    setTimeout(function(){generator.next()}, ms);
  },
  initPosition:function(){
    var self = this;
    console.log("ser servo init position");
    return new Promise(function(resolve, reject){
      var thread = (function* (){
        yield self.setServo(0,0,thread);
        yield self.sleep(500,thread);
        yield self.setServo(1,0,thread);
        yield self.sleep(500,thread);
        yield self.setServo(2,-80,thread);
        yield self.sleep(500,thread);
        yield self.setServo(3,15,thread);

        resolve();
      })();
      thread.next();
    });
  },
  switchOn:function(){
    console.log("switch on");
    var self = this;
    console.log("ser servo init position");
    return new Promise(function(resolve, reject){
      var thread = (function* (){
        yield self.setServo(1,20,thread);
        yield self.sleep(50,thread);

        resolve();
      })();
      thread.next();
    });
  },
  switchOff:function(){
    console.log("switch off");
    var self = this;
    console.log("ser servo init position");
    return new Promise(function(resolve, reject){
      var thread = (function* (){
        yield self.setServo(1,-10,thread);
        yield self.sleep(50,thread);

        resolve();
      })();
      thread.next();
    });
  },
  umbrellaOn:function(){
    console.log("umbrella switch on");
    var self = this;
    console.log("ser servo init position");
    return new Promise(function(resolve, reject){
      var thread = (function* (){
        yield self.setServo(4,-90,thread);
        yield self.sleep(50,thread);

        resolve();
      })();
      thread.next();
    });
  },
  umbrellaOff:function(){
    console.log("umbrella switch off");
    var self = this;
    console.log("ser servo init position");
    return new Promise(function(resolve, reject){
      var thread = (function* (){
        yield self.setServo(4,90,thread);
        yield self.sleep(50,thread);

        resolve();
      })();
      thread.next();
    });
  },
  waterOn:function(){
    console.log("water pump switch on");
    var self = this;
    console.log(self);
    console.log("ser servo init position");
    return new Promise(function(resolve, reject){
      var thread = (function* (){
        yield self.setServo(5,-90,thread);
        yield self.sleep(50,thread);
        
        resolve();
      })();
      thread.next();
    });
  },
  waterOff:function(){
    console.log("water pump switch off");
    var self = this;
    console.log(self);
    console.log("ser servo init position");
    return new Promise(function(resolve, reject){
      var thread = (function* (){
        yield self.setServo(5,90,thread);
        yield self.sleep(50,thread);
        resolve();
      })();
      thread.next();
    });
  }
}

function ifThen(input, operator, value, callback) {
  console.log("ifThen: ", input, operator, value, callback);
    switch (operator) {
      case '<':
        console.log("<");
        if (input < value) {
          callback(true);
        }
        else {
          callback(false);
        }
        break;
      case '<=':
        console.log("<=");
        if (input <= value) {
          callback(true);
        }
        else {
          callback(false);
        }
        break;
      case '=':
        console.log("=");
        if (input === value) {
          callback(true);
        }
        else {
          callback(false);
        }
        break;
      case '>':
        console.log(">");
        if (input > value) {
          callback(true);
        }
        else {
          callback(false);
        }
        break;
      case '>=':
        console.log(">=");
        if (input >= value) {
          callback(true);
        }
        else {
          callback(false);
        }
        break;
      default:
        console.log("default");
    }
}

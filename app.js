const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const startApp = async () => {
  // Ask if user is ready
  const answer = await inquirer.prompt([
    {
      name: 'start',
      message:
        'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }
  ]);

  // if answer is no, just quit the app
  if (!answer.start) process.exit();

  // ask about input file and watermark type
  const input = await inquirer.prompt([
    {
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg'
    }
  ]);

  if (fs.existsSync('./img/' + input.inputImage)) {
    const ifAlter = await inquirer.prompt([
      {
        name: 'question',
        message: 'Do you want to filter the photo?',
        type: 'confirm'
      }
    ]);
    if (ifAlter.question) {
      const alter = await inquirer.prompt([
        {
          name: 'alterations',
          type: 'list',
          choices: [
            'make image brighter',
            'increase contrast',
            'make image b&w',
            'invert image'
          ]
        }
      ]);
      if (alter.alterations === 'make image brighter') {
        addFilter('./img/' + input.inputImage, 'brightness');
      } else if (alter.alterations === 'increase contrast') {
        addFilter('./img/' + input.inputImage, 'contrast');
      } else if (alter.alterations === 'make image b&w') {
        addFilter('./img/' + input.inputImage, 'b&w');
      } else if (alter.alterations === 'invert image') {
        addFilter('./img/' + input.inputImage, 'invert');
      }
    }

    const options = await inquirer.prompt([
      {
        name: 'watermarkType',
        type: 'list',
        choices: ['Text watermark', 'Image watermark']
      }
    ]);

    if (options.watermarkType === 'Text watermark') {
      const text = await inquirer.prompt([
        {
          name: 'value',
          type: 'input',
          message: 'Type your watermark text:'
        }
      ]);
      options.watermarkText = text.value;
      addTextWatermarkToImage(
        './img/' + input.inputImage,
        './img/' + prepareOutputFilename(input.inputImage),
        options.watermarkText
      );
    } else {
      const image = await inquirer.prompt([
        {
          name: 'filename',
          type: 'input',
          message: 'Type your watermark name:',
          default: 'logo.png'
        }
      ]);
      if (fs.existsSync('./img/' + image.filename)) {
        options.watermarkImage = image.filename;
        addImageWatermarkToImage(
          './img/' + input.inputImage,
          './img/' + prepareOutputFilename(input.inputImage),
          './img/' + options.watermarkImage
        );
      } else {
        const error = await inquirer.prompt([
          {
            name: 'error',
            message: 'Something went wrong... Try again',
            type: 'input'
          }
        ]);
      }
    }
  } else {
    const error = await inquirer.prompt([
      {
        name: 'error',
        message: 'Something went wrong... Try again',
        type: 'input'
      }
    ]);
  }
};

startApp();

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    };
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('Success! Congrats!');
    startApp();
  } catch (error) {
    console.log('Something went wrong... Try again!');
  }
};

const addImageWatermarkToImage = async function(
  inputFile,
  outputFile,
  watermarkFile
) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    watermark.scale(0.5);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('Success! Congrats!');
    startApp();
  } catch (error) {
    console.log('Something went wrong... Try again!');
  }
};

const prepareOutputFilename = function(name) {
  const [firstName, extension] = name.split('.');
  return `${firstName}-with-watermark.${extension}`;
};

const addFilter = async function(file, filter) {
  const image = await Jimp.read(file);
  if (filter === 'brightness') {
    image.brightness(0.5);
  } else if (filter === 'contrast') {
    image.contrast(0.5);
  } else if (filter === 'b&w') {
    image.grayscale();
  } else if (filter === 'invert') {
    image.invert();
  }
  await image.quality(100).writeAsync(file);
};

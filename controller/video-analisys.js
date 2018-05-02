const fs = require('fs-extra');
const JsonDB = require('node-json-db');
const ffmpeg = require('fluent-ffmpeg');
// const cv = require('opencv4nodejs');
// const fr = require('face-recognition');
// const detector = fr.FaceDetector();

const db = new JsonDB('videodb', true, true);

exports.getSessions = ctx => {
  const sessions = db.getData('/sessions');
  ctx.body = { sessions };
};

exports.saveVideoData = wss => ctx => {
  const { sessionId, stepNumber, videoData, videoOptions } = ctx.request.body;
  if (isVideo(videoData)) {
    saveVideo(videoData, sessionId, stepNumber, videoOptions);
    saveVideoDataToDb(sessionId, stepNumber, videoOptions, 'webm');
    broadcast(wss);
  } else {
    encodeAndSaveVideo(videoData, sessionId, stepNumber, videoOptions);
    saveVideoDataToDb(sessionId, stepNumber, videoOptions, 'mp4');
    broadcast(wss);
  }
  ctx.body = { message: 'success!' };
};

function broadcast(wss) {
  wss.clients.forEach(function each(client) {
    // if (client.readyState === WebSocket.OPEN) {
    client.send('newVideo');
    // }
  });
}

function isVideo(data) {
  // if is a string then must be a video
  return typeof data === 'string';
}

function saveVideo(videoData, sessionId, step) {
  const webmVideoB64 = videoData.replace(/^data:video\/webm;base64,/, '');
  fs
    .outputFile(
      `public/videos/${sessionId}/step${step}.webm`,
      webmVideoB64,
      'base64'
    )
    .catch(err => console.log(err));
}

function encodeAndSaveVideo(videoData, sessionId, step, videoOptions) {
  const regx = RegExp(`^data:image\/${videoOptions.imageType};base64,`);
  videoData.forEach((frame, idx) => {
    const base64Frame = frame.replace(regx, '');
    fs
      .outputFile(
        `public/images/${sessionId}/${idx}.${videoOptions.imageType}`,
        base64Frame,
        'base64'
      )
      .catch(err => console.log('Writing images to disk:', err));
  });
  fs.ensureDir(`public/videos/${sessionId}`).then(
    ffmpeg()
      .addInput(`public/images/${sessionId}/%d.${videoOptions.imageType}`)
      .inputFPS(videoOptions.fps)
      .save(`public/videos/${sessionId}/step${step}.mp4`)
      .on('error', (err, stdout, stderr) => {
        console.log('Cannot process video: ' + err.message);
      })
  );
}

const saveVideoDataToDb = (sessionId, step, videoOptions, encapsulation) => {
  const sessions = db.getData('/sessions');
  const idx = sessions.findIndex(({ id }) => id === sessionId);
  if (idx !== -1) {
    db.push(
      `/sessions[${idx}]`,
      { [`step${step}`]: { date: Date.now() } },
      false
    );
  } else {
    db.push('/sessions[]', {
      id: sessionId,
      active: true,
      [`step${step}`]: { date: Date.now() },
      videoOptions,
      encapsulation,
    });
  }
};

// exports.detectFaces = ctx => {
//   const base64Data = ctx.request.body.imgBase64.replace(
//     /^data:image\/png;base64,/,
//     ''
//   );
//   const buffer = Buffer.from(base64Data, 'base64');
//   const mat = cv.imdecode(buffer);
//   const image = new fr.CvImageWrap(
//     mat.rows,
//     mat.cols,
//     mat.step,
//     mat.elemSize,
//     mat.getData()
//   );

//   const results = detector.locateFaces(image);
//   ctx.body = results;
// };

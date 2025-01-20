const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length;

let interpolate = (p, relativePoint) => {
  let tmp0 = p.row(1).col(0).data32S[0] * p.row(2).col(0).data32S[1]
  let tmp1 = p.row(2).col(0).data32S[0] * p.row(1).col(0).data32S[1]
  let tmp2 = tmp0 - tmp1
  let tmp3 = p.row(1).col(0).data32S[0] * p.row(3).col(0).data32S[1]
  let tmp4 = tmp2 - tmp3
  let tmp5 = p.row(3).col(0).data32S[0] * p.row(1).col(0).data32S[1]
  let tmp6 = p.row(2).col(0).data32S[0] * p.row(3).col(0).data32S[1]
  let tmp7 = p.row(3).col(0).data32S[0] * p.row(2).col(0).data32S[1]
  let tmp8 = tmp4 + tmp5 + tmp6 - tmp7
  let tmp9 = p.row(0).col(0).data32S[0] * p.row(2).col(0).data32S[0]
  let tmp10 = tmp9 * p.row(1).col(0).data32S[1]
  let tmp11 = p.row(1).col(0).data32S[0] * p.row(2).col(0).data32S[0]
  let tmp12 = p.row(0).col(0).data32S[0] * p.row(3).col(0).data32S[0]
  let tmp13 = p.row(1).col(0).data32S[0] * p.row(3).col(0).data32S[0]
  let tmp14 = tmp13 * p.row(0).col(0).data32S[1]
  let tmp15 = tmp9 * p.row(3).col(0).data32S[1]
  let tmp16 = tmp13 * p.row(2).col(0).data32S[1]
  let tmp17 = tmp10 - tmp11 * p.row(0).col(0).data32S[1] - tmp12 * p.row(1).col(0).data32S[1] + tmp14 - tmp15 + tmp12 * p.row(2).col(0).data32S[1] + tmp11 * p.row(3).col(0).data32S[1] - tmp16
  let tmp18 = p.row(0).col(0).data32S[0] * p.row(1).col(0).data32S[0]
  let tmp19 = p.row(2).col(0).data32S[0] * p.row(3).col(0).data32S[0]
  let tmp20 = tmp18 * p.row(2).col(0).data32S[1] - tmp10 - tmp18 * p.row(3).col(0).data32S[1] + tmp14 + tmp15 - tmp19 * p.row(0).col(0).data32S[1] - tmp16 + tmp19 * p.row(1).col(0).data32S[1]
  let tmp21 = p.row(0).col(0).data32S[0] * p.row(1).col(0).data32S[1]
  let tmp22 = p.row(1).col(0).data32S[0] * p.row(0).col(0).data32S[1]
  let tmp23 = tmp22 * p.row(2).col(0).data32S[1]
  let tmp24 = tmp21 * p.row(3).col(0).data32S[1]
  let tmp25 = p.row(2).col(0).data32S[0] * p.row(0).col(0).data32S[1]
  let tmp26 = p.row(3).col(0).data32S[0] * p.row(0).col(0).data32S[1]
  let tmp27 = tmp26 * p.row(2).col(0).data32S[1]
  let tmp28 = tmp1 * p.row(3).col(0).data32S[1]
  let tmp29 = tmp21 * p.row(2).col(0).data32S[1] - tmp23 - tmp24 + tmp22 * p.row(3).col(0).data32S[1] - tmp25 * p.row(3).col(0).data32S[1] + tmp27 + tmp28 - tmp5 * p.row(2).col(0).data32S[1]
  let tmp30 = p.row(0).col(0).data32S[0] * p.row(2).col(0).data32S[1]
  let tmp31 = tmp23 - tmp25 * p.row(1).col(0).data32S[1] - tmp24 + tmp26 * p.row(1).col(0).data32S[1] + tmp30 * p.row(3).col(0).data32S[1] - tmp27 - tmp0 * p.row(3).col(0).data32S[1] + tmp28
  let tmp32 = p.row(0).col(0).data32S[0] * p.row(3).col(0).data32S[1]
  let tmp33 = tmp30 - tmp25 - tmp32 - tmp0 + tmp1 + tmp26 + tmp3 - tmp5
  let tmp34 = tmp21 - tmp22
  let tmp35 = tmp34 - tmp30 + tmp25 + tmp3 - tmp5 - tmp6 + tmp7
  let hx = (tmp17 / tmp8) * relativePoint[0] - (tmp20 / tmp8) * relativePoint[1] + p.row(0).col(0).data32S[0]
  let hy = (tmp29 / tmp8) * relativePoint[0] - (tmp31 / tmp8) * relativePoint[1] + p.row(0).col(0).data32S[1]
  let hw = (tmp33 / tmp8) * relativePoint[0] + (tmp35 / tmp8) * relativePoint[1] + 1
  
  return [hy / hw, hx / hw]
}

let rotate = (w, d) => {
  let wr = 0;
  for(let r = d - 1; r >= 0; r--){
    for(let c = 0; c < d; c++){
      let b = r + d * c;
      wr = wr << 1;
      if((w & (1 << b)) != 0)
        wr |= 1;
    }
  }
  return wr;
}

let decode = (tagCode, points) => {
  let bestId = -1;
  let bestHamming = 255;
  let bestRotation = -1;
  let bestCode = -1;
  rCodes = tagCode;
  
  for(let r = 0; r < 4; r++){
    let index = 0;
    TAG36H11.forEach((tag) => {
      let distance = ( tag ^ rCodes ).toString(2).split('1').length - 1;
      if (distance < bestHamming){
        bestHamming = distance;
        bestId = index;
        bestCode = tag;
        bestRotation = r;
      }
      index ++;
    });
    rCodes = rotate(rCodes, 6);
  }
  tagDetection = {};
  tagDetection.id = bestId;
  tagDetection.hammingDistance = bestHamming;
  tagDetection.obsCode = tagCode;
  tagDetection.matchCode = bestCode;
  tagDetection.rotation = bestRotation;
  // With opencvjs I find out 4 is resulting more accurate detections than 3
  if (bestHamming <= 4) { 
    tagDetection.good = true;
    tagDetection.points = points;
  }
  else{
    tagDetection.good = false;
    tagDetection.points = null;
  }
  return tagDetection;
}


let decodeQuad = (quads, gray) => {
  let detections = new Array();
  let points = new Array();
  for(let i = 0; i < quads.size(); i++){
    let dd = 2*1 + 6;
    let blackValue = new Array();
    let whiteValue = new Array();
    let tagCode = 0;
    for(let iy = 0; iy < dd; iy++){
      for(let ix = 0; ix < dd; ix++){
        let x = (ix + 0.5) / dd;
        let y = (iy + 0.5) / dd;
        let point = interpolate(quads.get(i), [x, y]);
        point[0] = parseInt(point[0]);
        point[1] = parseInt(point[1]);
        points.push(point);
        let value = gray.row(point[0]).col(point[1]).data[0];
        if ((iy == 0 || iy == dd - 1) || (ix == 0 || ix == dd - 1))
          blackValue.push(value);
        else if ((iy == 1 || iy == dd - 2) || (ix == 1 || ix == dd - 2))
          whiteValue.push(value);
        else
          continue
      }
    }
    let threshold = (average(blackValue) + average(whiteValue)) / 2;
    for(let iy = 0; iy < dd; iy++){
      for(let ix = 0; ix < dd; ix++){
        if ((iy == 0 || iy == dd - 1) || (ix == 0 || ix == dd - 1))
          continue
        let x = (ix + 0.5) / dd;
        let y = (iy + 0.5) / dd;
        let point = interpolate(quads.get(i), [x, y]);
        point[0] = parseInt(point[0]);
        point[1] = parseInt(point[1]);
        let value = gray.row(point[0]).col(point[1]).data[0];
        tagCode = tagCode << 1;
        if( value > threshold )
          tagCode |= 1
      }
    }
    let detection = decode(tagCode, quads.get(i));
    //console.log(detection);
    if ( detection.good == true ) 
      detections.push(detection);
  }
  return detections;
}

const detect = (mat, callback) => {
  let gray = new cv.Mat();
  let img = new cv.Mat();
  cv.cvtColor(mat, gray, cv.COLOR_RGB2GRAY);
  // 1 - Blur 
  let ksize = new cv.Size(3, 3);
  cv.GaussianBlur(gray, img, ksize, 0.8);
  // 2 - Adaptive Thresholding
  // cv.adaptiveThreshold(img, img, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 9, 5);
  cv.adaptiveThreshold(
    img, // InputArray 	src,
    img, // OutputArray 	dst,
    255, // double 	maxValue,
    cv.ADAPTIVE_THRESH_MEAN_C, // int 	adaptiveMethod,
    cv.THRESH_BINARY_INV, // int 	thresholdType,
    11,  // int 	blockSize,
    5 // double 	C 
  );

  let msize = new cv.Size(2, 2);
  let M = new cv.Mat();
  M = cv.getStructuringElement(cv.MORPH_RECT, msize);
  cv.morphologyEx(img, img, cv.MORPH_OPEN, M);
  // 3 - Finding Contours
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(img, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  // 4 -  Compute Convex Hulls and Find Maximum Inscribed Quadrilaterals
  let quads = new cv.MatVector();
  for (let i = 0; i<contours.size(); i++){
    if(hierarchy.row(0).col(i).data32S[3] < 0 && contours.get(i).data32S.length >= 8){
      let area = cv.contourArea(contours.get(i))
      // if (area > 400){
      if (area > 200){
        let hull = new cv.Mat();
        cv.convexHull(contours.get(i), hull);
        // if((area / cv.contourArea(hull)) > 0.8){
        if((area / cv.contourArea(hull)) > 0.4){
          let quad = new cv.Mat();
          cv.approxPolyDP(hull, quad, 8, true)

          if(quad.data32S.length == 8){
            let areaQuad = cv.contourArea(quad);
            let areaHull = cv.contourArea(hull);
            if( (areaQuad / areaHull) > 0.8 && areaHull >= areaQuad )
              quads.push_back(quad);
          }
        }
      }
    }
  }
  // 5 - Decode Quadrilaterals
  let detections = decodeQuad(quads, gray);
  callback(detections);
}; 

TAG36H11 =  [







0x0000000d5d628584,
0x0000000d97f18b49,
0x0000000dd280910e,
0x0000000e479e9c98,
0x0000000ebcbca822,
0x0000000f31dab3ac,
0x0000000056a5d085,
0x000000010652e1d4,
0x000000022b1dfead,
0x0000000265ad0472,
0x000000034fe91b86,
0x00000003ff962cd5,
0x000000043a25329a,
0x0000000474b4385f,
0x00000004e9d243e9,
0x00000005246149ae,
0x00000005997f5538,
0x0000000683bb6c4c,
0x00000006be4a7211,
0x00000007e3158eea,
0x000000081da494af,
0x0000000858339a74,
0x00000008cd51a5fe,
0x00000009f21cc2d7,
0x0000000a2cabc89c,
0x0000000adc58d9eb,
0x0000000b16e7dfb0,
0x0000000b8c05eb3a,
0x0000000d25ef139d,
0x0000000d607e1962,
0x0000000e4aba3076,
0x00000002dde6a3da,
0x000000043d40c678,
0x00000005620be351,
0x000000064c47fa65,
0x0000000686d7002a,
0x00000006c16605ef,
0x00000006fbf50bb4,
0x00000008d06d39dc,
0x00000009f53856b5,
0x0000000adf746dc9,
0x0000000bc9b084dd,
0x0000000d290aa77b,
0x0000000d9e28b305,
0x0000000e4dd5c454,
0x0000000fad2fe6f2,
0x0000000181a8151a,
0x000000026be42c2e,
0x00000002e10237b8,
0x0000000405cd5491,
0x00000007742eab1c,
0x000000085e6ac230,
0x00000008d388cdba,
0x00000009f853ea93,
0x0000000c41ea2445,
0x0000000cf1973594,
0x000000014a34a333,
0x000000031eacd15b,
0x00000006c79d2dab,
0x000000073cbb3935,
0x000000089c155bd3,
0x00000008d6a46198,
0x000000091133675d,
0x0000000a708d89fb,
0x0000000ae5ab9585,
0x0000000b9558a6d4,
0x0000000b98743ab2,
0x0000000d6cec68da,
0x00000001506bcaef,
0x00000004becd217a,
0x00000004f95c273f,
0x0000000658b649dd,
0x0000000a76c4b1b7,
0x0000000ecf621f56,
0x00000001c8a56a57,
0x00000003628e92ba,
0x000000053706c0e2,
0x00000005e6b3d231,
0x00000007809cfa94,
0x0000000e97eead6f,
0x00000005af40604a,
0x00000007492988ad,
0x0000000ed5994712,
0x00000005eceaf9ed,
0x00000007c1632815,
0x0000000c1a0095b4,
0x0000000e9e25d52b,
0x00000003a6705419,
0x0000000a8333012f,
0x00000004ce5704d0,
0x0000000508e60a95,
0x0000000877476120,
0x0000000a864e950d,
0x0000000ea45cfce7,
0x000000019da047e8,
0x000000024d4d5937,
0x00000006e079cc9b,
0x000000099f2e11d7,
0x000000033aa50429,
0x0000000499ff26c7,
0x000000050f1d3251,
0x000000066e7754ef,
0x000000096ad633ce,
0x00000009a5653993,
0x0000000aca30566c,
0x0000000c298a790a,
0x00000008be44b65d,
0x0000000dc68f354b,
0x000000016f7f919b,
0x00000004dde0e826,
0x0000000d548cbd9f,
0x0000000e0439ceee,
0x0000000fd8b1fd16,
0x000000076521bb7b,
0x0000000d92375742,
0x0000000cab16d40c,
0x0000000730c9dd72,
0x0000000ad9ba39c2,
0x0000000b14493f87,
0x000000052b15651f,
0x0000000185409cad,
0x000000077ae2c68d,
0x000000094f5af4b5,
0x00000000a13bad55,
0x000000061ea437cd,
0x0000000a022399e2,
0x0000000203b163d1,
0x00000007bba8f40e
];
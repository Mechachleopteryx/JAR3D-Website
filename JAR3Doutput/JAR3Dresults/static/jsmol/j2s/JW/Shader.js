Clazz.declarePackage ("JW");
Clazz.load (["JU.AU", "$.V3"], "JW.Shader", ["JU.CU", "JW.C"], function () {
c$ = Clazz.decorateAsClass (function () {
this.xLight = 0;
this.yLight = 0;
this.zLight = 0;
this.lightSource = null;
this.specularOn = true;
this.usePhongExponent = false;
this.ambientPercent = 45;
this.diffusePercent = 84;
this.specularExponent = 6;
this.specularPercent = 22;
this.specularPower = 40;
this.phongExponent = 64;
this.ambientFraction = 0;
this.diffuseFactor = 0;
this.intenseFraction = 0;
this.specularFactor = 0;
this.ashades = null;
this.ashadesGreyscale = null;
this.celOn = false;
this.celPower = 10;
this.celRGB = 0;
this.celZ = 0;
this.useLight = false;
this.sphereShadeIndexes = null;
this.seed = 0x12345679;
this.sphereShapeCache = null;
this.ellipsoidShades = null;
this.nOut = 0;
this.nIn = 0;
Clazz.instantialize (this, arguments);
}, JW, "Shader");
Clazz.prepareFields (c$, function () {
this.lightSource =  new JU.V3 ();
this.ambientFraction = this.ambientPercent / 100;
this.diffuseFactor = this.diffusePercent / 100;
this.intenseFraction = this.specularPower / 100;
this.specularFactor = this.specularPercent / 100;
this.ashades = JU.AU.newInt2 (128);
this.sphereShadeIndexes =  Clazz.newByteArray (65536, 0);
this.sphereShapeCache = JU.AU.newInt2 (128);
});
Clazz.makeConstructor (c$, 
function () {
this.setLightSource (-1.0, -1.0, 2.5);
});
Clazz.defineMethod (c$, "setLightSource", 
 function (x, y, z) {
this.lightSource.set (x, y, z);
this.lightSource.normalize ();
this.xLight = this.lightSource.x;
this.yLight = this.lightSource.y;
this.zLight = this.lightSource.z;
}, "~N,~N,~N");
Clazz.defineMethod (c$, "setCel", 
function (celShading, celShadingPower, argb) {
celShading = celShading && celShadingPower != 0;
argb = JW.C.getArgb (JW.C.getBgContrast (argb));
argb = (argb == 0xFF000000 ? 0xFF040404 : argb == -1 ? -2 : argb + 1);
if (this.celOn == celShading && this.celRGB == argb && this.celPower == celShadingPower) return;
this.celOn = celShading;
this.celPower = celShadingPower;
this.useLight = (!this.celOn || celShadingPower > 0);
this.celZ = 1 - Math.pow (2, -Math.abs (celShadingPower) / 10);
this.celRGB = argb;
this.flushCaches ();
}, "~B,~N,~N");
Clazz.defineMethod (c$, "flushCaches", 
function () {
this.flushShades ();
this.flushSphereCache ();
});
Clazz.defineMethod (c$, "setLastColix", 
function (argb, asGrey) {
JW.C.allocateColix (argb);
this.checkShades ();
if (asGrey) JW.C.setLastGrey (argb);
this.ashades[2047] = this.getShades2 (argb, false);
}, "~N,~B");
Clazz.defineMethod (c$, "getShades", 
function (colix) {
this.checkShades ();
colix &= -30721;
var shades = this.ashades[colix];
if (shades == null) shades = this.ashades[colix] = this.getShades2 (JW.C.argbs[colix], false);
return shades;
}, "~N");
Clazz.defineMethod (c$, "getShadesG", 
function (colix) {
this.checkShades ();
colix &= -30721;
if (this.ashadesGreyscale == null) this.ashadesGreyscale = JU.AU.newInt2 (this.ashades.length);
var shadesGreyscale = this.ashadesGreyscale[colix];
if (shadesGreyscale == null) shadesGreyscale = this.ashadesGreyscale[colix] = this.getShades2 (JW.C.argbs[colix], true);
return shadesGreyscale;
}, "~N");
Clazz.defineMethod (c$, "checkShades", 
 function () {
if (this.ashades != null && this.ashades.length == JW.C.colixMax) return;
this.ashades = JU.AU.arrayCopyII (this.ashades, JW.C.colixMax);
if (this.ashadesGreyscale != null) this.ashadesGreyscale = JU.AU.arrayCopyII (this.ashadesGreyscale, JW.C.colixMax);
});
Clazz.defineMethod (c$, "flushShades", 
function () {
this.checkShades ();
for (var i = JW.C.colixMax; --i >= 0; ) this.ashades[i] = null;

this.calcSphereShading ();
});
Clazz.defineMethod (c$, "getShades2", 
 function (rgb, greyScale) {
var shades =  Clazz.newIntArray (JW.Shader.shadeIndexMax, 0);
if (rgb == 0) return shades;
var red0 = ((rgb >> 16) & 0xFF);
var grn0 = ((rgb >> 8) & 0xFF);
var blu0 = (rgb & 0xFF);
var red = 0;
var grn = 0;
var blu = 0;
var f = this.ambientFraction;
while (true) {
red = red0 * f + 0.5;
grn = grn0 * f + 0.5;
blu = blu0 * f + 0.5;
if (f > 0 && red < 4 && grn < 4 && blu < 4) {
red0++;
grn0++;
blu0++;
if (f < 0.1) f += 0.1;
rgb = JU.CU.rgb (Clazz.doubleToInt (Math.floor (red0)), Clazz.doubleToInt (Math.floor (grn0)), Clazz.doubleToInt (Math.floor (blu0)));
continue;
}break;
}
var i = 0;
f = (1 - f) / JW.Shader.shadeIndexNormal;
var redStep = red0 * f;
var grnStep = grn0 * f;
var bluStep = blu0 * f;
if (this.celOn) {
var max = Clazz.doubleToInt (JW.Shader.shadeIndexMax / 2);
var _rgb = JU.CU.rgb (Clazz.doubleToInt (Math.floor (red)), Clazz.doubleToInt (Math.floor (grn)), Clazz.doubleToInt (Math.floor (blu)));
if (this.celPower >= 0) for (; i < max; ++i) shades[i] = _rgb;

red += redStep * max;
grn += grnStep * max;
blu += bluStep * max;
_rgb = JU.CU.rgb (Clazz.doubleToInt (Math.floor (red)), Clazz.doubleToInt (Math.floor (grn)), Clazz.doubleToInt (Math.floor (blu)));
for (; i < JW.Shader.shadeIndexMax; i++) shades[i] = _rgb;

shades[0] = shades[1] = this.celRGB;
} else {
for (; i < JW.Shader.shadeIndexNormal; ++i) {
shades[i] = JU.CU.rgb (Clazz.doubleToInt (Math.floor (red)), Clazz.doubleToInt (Math.floor (grn)), Clazz.doubleToInt (Math.floor (blu)));
red += redStep;
grn += grnStep;
blu += bluStep;
}
shades[i++] = rgb;
f = this.intenseFraction / (JW.Shader.shadeIndexMax - i);
redStep = (255.5 - red) * f;
grnStep = (255.5 - grn) * f;
bluStep = (255.5 - blu) * f;
for (; i < JW.Shader.shadeIndexMax; i++) {
red += redStep;
grn += grnStep;
blu += bluStep;
shades[i] = JU.CU.rgb (Clazz.doubleToInt (Math.floor (red)), Clazz.doubleToInt (Math.floor (grn)), Clazz.doubleToInt (Math.floor (blu)));
}
}if (greyScale) for (; --i >= 0; ) shades[i] = JU.CU.toFFGGGfromRGB (shades[i]);

return shades;
}, "~N,~B");
Clazz.defineMethod (c$, "getShadeIndex", 
function (x, y, z) {
var magnitude = Math.sqrt (x * x + y * y + z * z);
return Math.round (this.getShadeF ((x / magnitude), (y / magnitude), (z / magnitude)) * JW.Shader.shadeIndexLast);
}, "~N,~N,~N");
Clazz.defineMethod (c$, "getShadeB", 
function (x, y, z) {
return Math.round (this.getShadeF (x, y, z) * JW.Shader.shadeIndexLast);
}, "~N,~N,~N");
Clazz.defineMethod (c$, "getShadeFp8", 
function (x, y, z) {
var magnitude = Math.sqrt (x * x + y * y + z * z);
return Clazz.doubleToInt (Math.floor (this.getShadeF ((x / magnitude), (y / magnitude), (z / magnitude)) * JW.Shader.shadeIndexLast * (256)));
}, "~N,~N,~N");
Clazz.defineMethod (c$, "getShadeF", 
 function (x, y, z) {
var NdotL = (this.useLight ? x * this.xLight + y * this.yLight + z * this.zLight : z);
if (NdotL <= 0) return 0;
var intensity = NdotL * this.diffuseFactor;
if (this.specularOn) {
var k_specular = 2 * NdotL * z - this.zLight;
if (k_specular > 0) {
if (this.usePhongExponent) {
k_specular = Math.pow (k_specular, this.phongExponent);
} else {
for (var n = this.specularExponent; --n >= 0 && k_specular > .0001; ) k_specular *= k_specular;

}intensity += k_specular * this.specularFactor;
}}return (this.celOn && z < this.celZ ? 0 : intensity > 1 ? 1 : intensity);
}, "~N,~N,~N");
Clazz.defineMethod (c$, "getShadeN", 
function (x, y, z, r) {
var fp8ShadeIndex = Clazz.doubleToInt (Math.floor (this.getShadeF (x / r, y / r, z / r) * JW.Shader.shadeIndexLast * (256)));
var shadeIndex = fp8ShadeIndex >> 8;
if (!this.useLight) return shadeIndex;
if ((fp8ShadeIndex & 0xFF) > this.nextRandom8Bit ()) ++shadeIndex;
var random16bit = this.seed & 0xFFFF;
if (random16bit < 21845 && shadeIndex > 0) --shadeIndex;
 else if (random16bit > 43690 && shadeIndex < JW.Shader.shadeIndexLast) ++shadeIndex;
return shadeIndex;
}, "~N,~N,~N,~N");
Clazz.defineMethod (c$, "calcSphereShading", 
 function () {
var xF = -127.5;
var r2 = 16900;
for (var i = 0; i < 256; ++xF, ++i) {
var yF = -127.5;
var xF2 = xF * xF;
for (var j = 0; j < 256; ++yF, ++j) {
var shadeIndex = 0;
var z2 = r2 - xF2 - yF * yF;
if (z2 > 0) {
var z = Math.sqrt (z2);
shadeIndex = this.getShadeN (xF, yF, z, 130);
}this.sphereShadeIndexes[(j << 8) + i] = shadeIndex;
}
}
});
Clazz.defineMethod (c$, "nextRandom8Bit", 
function () {
var t = this.seed;
this.seed = t = ((t << 16) + (t << 1) + t) & 0x7FFFFFFF;
return t >> 23;
});
Clazz.defineMethod (c$, "getEllipsoidShade", 
function (x, y, z, radius, mDeriv) {
var tx = mDeriv.m00 * x + mDeriv.m01 * y + mDeriv.m02 * z + mDeriv.m03;
var ty = mDeriv.m10 * x + mDeriv.m11 * y + mDeriv.m12 * z + mDeriv.m13;
var tz = mDeriv.m20 * x + mDeriv.m21 * y + mDeriv.m22 * z + mDeriv.m23;
var f = Math.min (radius / 2, 45) / Math.sqrt (tx * tx + ty * ty + tz * tz);
var i = Clazz.floatToInt (-tx * f);
var j = Clazz.floatToInt (-ty * f);
var k = Clazz.floatToInt (tz * f);
var outside = i < -20 || i >= 20 || j < -20 || j >= 20 || k < 0 || k >= 40;
if (outside) {
while (i % 2 == 0 && j % 2 == 0 && k % 2 == 0 && i + j + k > 0) {
i >>= 1;
j >>= 1;
k >>= 1;
}
outside = i < -20 || i >= 20 || j < -20 || j >= 20 || k < 0 || k >= 40;
}if (outside) this.nOut++;
 else this.nIn++;
return (outside ? this.getShadeIndex (i, j, k) : this.ellipsoidShades[i + 20][j + 20][k]);
}, "~N,~N,~N,~N,JU.M4");
Clazz.defineMethod (c$, "createEllipsoidShades", 
function () {
this.ellipsoidShades =  Clazz.newByteArray (40, 40, 40, 0);
for (var ii = 0; ii < 40; ii++) for (var jj = 0; jj < 40; jj++) for (var kk = 0; kk < 40; kk++) this.ellipsoidShades[ii][jj][kk] = this.getShadeIndex (ii - 20, jj - 20, kk);



});
Clazz.defineMethod (c$, "flushSphereCache", 
function () {
for (var i = 128; --i >= 0; ) this.sphereShapeCache[i] = null;

this.ellipsoidShades = null;
});
Clazz.defineMethod (c$, "occludePixels", 
function (pbuf, zbuf, aobuf, width, height, ambientOcclusion) {
var n = zbuf.length;
for (var x = 0, y = 0, offset = 0; offset < n; offset++) {
var z = zbuf[offset];
var xymax = Math.min (z >> 5, 0);
if (xymax == 0) continue;
var r2max = xymax * xymax;
var pxmax = Math.min (width, x + xymax);
var pymax = Math.min (height, y + xymax);
for (var px = Math.max (0, x - xymax); px < pxmax; px++) {
for (var py = Math.max (0, y - xymax); py < pymax; py++) {
var dx = px - x;
var dy = py - y;
var r2 = dx * dx + dy * dy;
if (r2 > r2max) continue;
var pt = offset + width * dy + dx;
var dz = zbuf[pt] - z;
if (dz <= z || dz * dz > r2) continue;
}
}
if (++x == width) {
x = 0;
y++;
}}
}, "~A,~A,~A,~N,~N,~N");
Clazz.defineStatics (c$,
"shadeIndexMax", 64);
c$.shadeIndexLast = c$.prototype.shadeIndexLast = JW.Shader.shadeIndexMax - 1;
Clazz.defineStatics (c$,
"shadeIndexNormal", 52,
"shadeIndexNoisyLimit", 56,
"SLIM", 20,
"SDIM", 40,
"maxSphereCache", 128);
});

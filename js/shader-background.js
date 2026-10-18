// WebGL2 Multi-Pass Black Hole Shader Background
// Translated from Shadertoy "Gargantua" into vanilla WebGL2

document.addEventListener("DOMContentLoaded", () => {
    const scene = document.getElementById('blackhole-scene');
    if (!scene) return;
    const motionButton = document.getElementById('motion-toggle');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
    let inView = true;
    let lost = false;
    let raf = 0;
    let lastFrame = 0;
    let elapsed = 8;
    const updateMotionButton = () => {
        motionButton.setAttribute('aria-pressed', String(paused));
        motionButton.querySelector('span').textContent = paused ? 'Resume motion' : 'Pause motion';
        motionButton.querySelector('use').setAttribute('href', paused ? '#play-icon' : '#pause-icon');
    };
    const canvas = document.createElement("canvas");
    canvas.id = "shader-background";
    // Setup canvas styling to act as a fixed background
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.opacity = "1";
    canvas.setAttribute('aria-hidden', 'true');

    // Insert right after the body tag
    scene.appendChild(canvas);

    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false });
    if (!gl) {
        canvas.remove();
        motionButton.querySelector('span').textContent = 'Still universe';
        return;
    }
    if (!gl.getExtension('EXT_color_buffer_float')) {
        canvas.remove();
        motionButton.querySelector('span').textContent = 'Still universe';
        return;
    }

    // --- Shaders ---
    const vsSource = `#version 300 es
    in vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
    `;

    const fsHeader = `#version 300 es
    precision highp float;
    uniform vec3 iResolution;
    uniform float iTime;
    uniform vec4 iMouse;
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform sampler2D iChannel3;
    out vec4 FragColor;
    `;

    const bufferA = fsHeader + `
    // Main render.
    #define ITERATIONS 60 // Reduced for background performance
    // #define TEMPORAL_AA

    const vec3 MainColor = vec3(1.0);

    float noise( in vec3 x ) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
        vec2 rg = textureLod( iChannel0, (uv+ 0.5)/256.0, 0.0 ).yx;
        return -1.0+2.0*mix( rg.x, rg.y, f.z );
    }

    float saturate(float x) { return clamp(x, 0.0, 1.0); }
    vec3 saturate(vec3 x) { return clamp(x, vec3(0.0), vec3(1.0)); }
    float rand(vec2 coord) { return saturate(fract(sin(dot(coord, vec2(12.9898, 78.223))) * 43758.5453)); }
    float pcurve( float x, float a, float b ) {
        float k = pow(a+b,a+b) / (pow(a,a)*pow(b,b));
        return k * pow( x, a ) * pow( 1.0-x, b );
    }

    const float pi = 3.14159265;
    float atan2(float y, float x) {
        if (x > 0.0) return atan(y / x);
        else if (x == 0.0) {
            if (y > 0.0) return pi / 2.0;
            else if (y < 0.0) return -(pi / 2.0);
            else return 0.0;
        } else {
            if (y >= 0.0) return atan(y / x) + pi;
            else return atan(y / x) - pi;
        }
    }

    float sdTorus(vec3 p, vec2 t) {
        vec2 q = vec2(length(p.xz) - t.x, p.y);
        return length(q)-t.y;
    }
    float sdSphere(vec3 p, float r) { return length(p)-r; }

    void Haze(inout vec3 color, vec3 pos, float alpha) {
        vec2 t = vec2(1.0, 0.01);
        float torusDist = length(sdTorus(pos + vec3(0.0, -0.05, 0.0), t));
        float bloomDisc = 1.0 / (pow(torusDist, 2.0) + 0.001);
        vec3 col = MainColor;
        bloomDisc *= length(pos) < 0.5 ? 0.0 : 1.0;
        color += col * bloomDisc * (2.9 / float(ITERATIONS)) * (1.0 - alpha * 1.0);
    }

    void GasDisc(inout vec3 color, inout float alpha, vec3 pos) {
        float discRadius = 3.2;
        float discWidth = 5.3;
        float discInner = discRadius - discWidth * 0.5;
        // float discOuter = discRadius + discWidth * 0.5;
        
        vec3 origin = vec3(0.0, 0.0, 0.0);
        vec3 discNormal = normalize(vec3(0.0, 1.0, 0.0));
        float discThickness = 0.1;

        float distFromCenter = distance(pos, origin);
        float distFromDisc = dot(discNormal, pos - origin);
        float radialGradient = 1.0 - saturate((distFromCenter - discInner) / discWidth * 0.5);
        float coverage = pcurve(radialGradient, 4.0, 0.9);

        discThickness *= radialGradient;
        coverage *= saturate(1.0 - abs(distFromDisc) / discThickness);

        vec3 dustColorLit = MainColor;
        float dustGlow = 1.0 / (pow(1.0 - radialGradient, 2.0) * 290.0 + 0.002);
        vec3 dustColor = dustColorLit * dustGlow * 8.2;

        coverage = saturate(coverage * 0.7);

        float fade = pow((abs(distFromCenter - discInner) + 0.4), 4.0) * 0.04;
        float bloomFactor = 1.0 / (pow(distFromDisc, 2.0) * 40.0 + fade + 0.00002);
        vec3 b = dustColorLit * pow(bloomFactor, 1.5);
        
        b *= mix(vec3(1.7, 1.1, 1.0), vec3(0.5, 0.6, 1.0), vec3(pow(radialGradient, 2.0)));
        b *= mix(vec3(1.7, 0.5, 0.1), vec3(1.0), vec3(pow(radialGradient, 0.5)));

        dustColor = mix(dustColor, b * 150.0, saturate(1.0 - coverage * 1.0));
        coverage = saturate(coverage + bloomFactor * bloomFactor * 0.1);
        
        if (coverage < 0.01) return;   
        
        vec3 radialCoords;
        radialCoords.x = distFromCenter * 1.5 + 0.55;
        radialCoords.y = atan2(-pos.x, -pos.z) * 1.5;
        radialCoords.z = distFromDisc * 1.5;
        radialCoords *= 0.95;
        
        float speed = 0.06;
        float noise1 = 1.0;
        vec3 rc = radialCoords + 0.0;               rc.y += iTime * speed;
        noise1 *= noise(rc * 3.0) * 0.5 + 0.5;      rc.y -= iTime * speed;
        noise1 *= noise(rc * 6.0) * 0.5 + 0.5;      rc.y += iTime * speed;
        noise1 *= noise(rc * 12.0) * 0.5 + 0.5;     rc.y -= iTime * speed;
        noise1 *= noise(rc * 24.0) * 0.5 + 0.5;     rc.y += iTime * speed;

        float noise2 = 2.0;
        rc = radialCoords + 30.0;
        noise2 *= noise(rc * 3.0) * 0.5 + 0.5;      rc.y += iTime * speed;
        noise2 *= noise(rc * 6.0) * 0.5 + 0.5;      rc.y -= iTime * speed;
        noise2 *= noise(rc * 12.0) * 0.5 + 0.5;     rc.y += iTime * speed;
        noise2 *= noise(rc * 24.0) * 0.5 + 0.5;     rc.y -= iTime * speed;
        noise2 *= noise(rc * 48.0) * 0.5 + 0.5;     rc.y += iTime * speed;
        noise2 *= noise(rc * 92.0) * 0.5 + 0.5;     rc.y -= iTime * speed;

        dustColor *= noise1 * 0.998 + 0.002;
        coverage *= noise2;
        
        radialCoords.y += iTime * speed * 0.5;
        dustColor *= pow(texture(iChannel1, radialCoords.yx * vec2(0.15, 0.27)).rgb, vec3(2.0)) * 4.0;

        coverage = saturate(coverage * 1200.0 / float(ITERATIONS));
        dustColor = max(vec3(0.0), dustColor);
        coverage *= pcurve(radialGradient, 4.0, 0.9);

        color = (1.0 - alpha) * dustColor * coverage + color;
        alpha = (1.0 - alpha) * coverage + alpha;
    }

    vec3 rotate(vec3 p, float x, float y, float z) {
        mat3 matx = mat3(1.0, 0.0, 0.0, 0.0, cos(x), sin(x), 0.0, -sin(x), cos(x));
        mat3 maty = mat3(cos(y), 0.0, -sin(y), 0.0, 1.0, 0.0, sin(y), 0.0, cos(y));
        mat3 matz = mat3(cos(z), sin(z), 0.0, -sin(z), cos(z), 0.0, 0.0, 0.0, 1.0);
        return maty * matz * matx * p;
    }

    void RotateCamera(inout vec3 eyevec, inout vec3 eyepos) {
        float mousePosY = iMouse.y / iResolution.y;
        float mousePosX = iMouse.x / iResolution.x;
        // Default slightly offset if no mouse interaction yet
        if (iMouse.x == 0.0 && iMouse.y == 0.0) {
            mousePosY = 0.5;
            mousePosX = 0.5;
        }
        vec3 angle = vec3(mousePosY * 0.05 + 0.05, 1.0 + mousePosX * 1.0, -0.45);
        eyevec = rotate(eyevec, angle.x, angle.y, angle.z);
        eyepos = rotate(eyepos, angle.x, angle.y, angle.z);
    }

    void WarpSpace(inout vec3 eyevec, inout vec3 raypos) {
        vec3 origin = vec3(0.0, 0.0, 0.0);
        float singularityDist = distance(raypos, origin);
        float warpFactor = 1.0 / (pow(singularityDist, 2.0) + 0.000001);
        vec3 singularityVector = normalize(origin - raypos);
        float warpAmount = 5.0;
        eyevec = normalize(eyevec + singularityVector * warpFactor * warpAmount / float(ITERATIONS));
    }

    void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 uv = fragCoord.xy / iResolution.xy;
        float aspect = iResolution.x / iResolution.y;
        vec2 uveye = uv;
        
        vec3 eyevec = normalize(vec3((uveye * 2.0 - 1.0) * vec2(aspect, 1.0), 6.0));
        vec3 eyepos = vec3(0.0, -0.0, -10.0);
        
        vec2 mousepos = iMouse.xy / iResolution.xy;
        if (mousepos.x == 0.0) mousepos.x = 0.35;
        eyepos.x += mousepos.x * 3.0 - 1.5;
        
        const float far = 15.0;
        RotateCamera(eyevec, eyepos);

        vec3 color = vec3(0.0, 0.0, 0.0);
        float dither = rand(uv) * 2.0;

        float alpha = 0.0;
        vec3 raypos = eyepos + eyevec * dither * far / float(ITERATIONS);
        for (int i = 0; i < ITERATIONS; i++) {        
            WarpSpace(eyevec, raypos);
            raypos += eyevec * far / float(ITERATIONS);
            GasDisc(color, alpha, raypos);
            Haze(color, raypos, alpha);
        }
        
        color *= 0.0001;
        FragColor = vec4(saturate(color), 1.0);
    }
    `;

    const bufferB = fsHeader + `
    vec3 ColorFetch(vec2 coord) { return texture(iChannel0, coord).rgb; }

    vec3 Grab(vec2 coord, const float octave, const vec2 offset, const int oversampling) {
        float scale = exp2(octave);
        coord += offset;
        coord *= scale;
        if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) return vec3(0.0);   
        
        if (oversampling == 1) return ColorFetch(coord);

        vec3 color = vec3(0.0);
        float weights = 0.0;
        for (int i = 0; i < oversampling; i++) {    	    
            for (int j = 0; j < oversampling; j++) {
                vec2 off = (vec2(i, j) / iResolution.xy) * scale / float(oversampling);
                color += ColorFetch(coord + off);
                weights += 1.0;
            }
        }
        color /= weights;
        return color;
    }

    vec2 CalcOffset(float octave) {
        vec2 offset = vec2(0.0);
        vec2 padding = vec2(10.0) / iResolution.xy;
        offset.x = -min(1.0, floor(octave / 3.0)) * (0.25 + padding.x);
        offset.y = -(1.0 - (1.0 / exp2(octave))) - padding.y * octave;
        offset.y += min(1.0, floor(octave / 3.0)) * 0.35;
        return offset;   
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec3 color = vec3(0.0);
        
        // Reduced oversampling to 2 for performance
        color += Grab(uv, 1.0, vec2(0.0, 0.0), 1);
        color += Grab(uv, 2.0, CalcOffset(1.0), 2);
        color += Grab(uv, 3.0, CalcOffset(2.0), 2);
        color += Grab(uv, 4.0, CalcOffset(3.0), 2);
        color += Grab(uv, 5.0, CalcOffset(4.0), 2);
        color += Grab(uv, 6.0, CalcOffset(5.0), 2);
        color += Grab(uv, 7.0, CalcOffset(6.0), 2);
        color += Grab(uv, 8.0, CalcOffset(7.0), 2);

        FragColor = vec4(color, 1.0);
    }
    `;

    const bufferC = fsHeader + `
    vec3 ColorFetch(vec2 coord) { return texture(iChannel0, coord).rgb; }
    void main() {    
        float weights[5] = float[](0.19638062, 0.29675293, 0.09442139, 0.01037598, 0.00025940);
        float offsets[5] = float[](0.0, 1.41176471, 3.29411765, 5.17647059, 7.05882353);
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec3 color = vec3(0.0);
        float weightSum = 0.0;
        
        if (uv.x < 0.52) {
            color += ColorFetch(uv) * weights[0];
            weightSum += weights[0];
            for(int i = 1; i < 5; i++) {
                vec2 offset = vec2(offsets[i]) / iResolution.xy;
                color += ColorFetch(uv + offset * vec2(0.5, 0.0)) * weights[i];
                color += ColorFetch(uv - offset * vec2(0.5, 0.0)) * weights[i];
                weightSum += weights[i] * 2.0;
            }
            color /= weightSum;
        }
        FragColor = vec4(color,1.0);
    }
    `;

    const bufferD = fsHeader + `
    vec3 ColorFetch(vec2 coord) { return texture(iChannel0, coord).rgb; }
    void main() {    
        float weights[5] = float[](0.19638062, 0.29675293, 0.09442139, 0.01037598, 0.00025940);
        float offsets[5] = float[](0.0, 1.41176471, 3.29411765, 5.17647059, 7.05882353);
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec3 color = vec3(0.0);
        float weightSum = 0.0;
        
        if (uv.x < 0.52) {
            color += ColorFetch(uv) * weights[0];
            weightSum += weights[0];
            for(int i = 1; i < 5; i++) {
                vec2 offset = vec2(offsets[i]) / iResolution.xy;
                color += ColorFetch(uv + offset * vec2(0.0, 0.5)) * weights[i];
                color += ColorFetch(uv - offset * vec2(0.0, 0.5)) * weights[i];
                weightSum += weights[i] * 2.0;
            }
            color /= weightSum;
        }
        FragColor = vec4(color,1.0);
    }
    `;

    const imagePass = fsHeader + `
    vec3 saturate(vec3 x) { return clamp(x, vec3(0.0), vec3(1.0)); }

    vec4 cubic(float x) {
        float x2 = x * x;
        float x3 = x2 * x;
        vec4 w;
        w.x =   -x3 + 3.0*x2 - 3.0*x + 1.0;
        w.y =  3.0*x3 - 6.0*x2       + 4.0;
        w.z = -3.0*x3 + 3.0*x2 + 3.0*x + 1.0;
        w.w =  x3;
        return w / 6.0;
    }

    vec4 BicubicTexture(in sampler2D tex, in vec2 coord) {
        vec2 resolution = iResolution.xy;
        coord *= resolution;
        float fx = fract(coord.x);
        float fy = fract(coord.y);
        coord.x -= fx;
        coord.y -= fy;
        fx -= 0.5;
        fy -= 0.5;
        vec4 xcubic = cubic(fx);
        vec4 ycubic = cubic(fy);
        vec4 c = vec4(coord.x - 0.5, coord.x + 1.5, coord.y - 0.5, coord.y + 1.5);
        vec4 s = vec4(xcubic.x + xcubic.y, xcubic.z + xcubic.w, ycubic.x + ycubic.y, ycubic.z + ycubic.w);
        vec4 offset = c + vec4(xcubic.y, xcubic.w, ycubic.y, ycubic.w) / s;
        vec4 sample0 = texture(tex, vec2(offset.x, offset.z) / resolution);
        vec4 sample1 = texture(tex, vec2(offset.y, offset.z) / resolution);
        vec4 sample2 = texture(tex, vec2(offset.x, offset.w) / resolution);
        vec4 sample3 = texture(tex, vec2(offset.y, offset.w) / resolution);
        float sx = s.x / (s.x + s.y);
        float sy = s.z / (s.z + s.w);
        return mix( mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
    }

    vec3 ColorFetch(vec2 coord) { return texture(iChannel0, coord).rgb; }
    vec3 BloomFetch(vec2 coord) { return BicubicTexture(iChannel3, coord).rgb; }

    vec3 Grab(vec2 coord, const float octave, const vec2 offset) {
        float scale = exp2(octave);
        coord /= scale;
        coord -= offset;
        return BloomFetch(coord);
    }

    vec2 CalcOffset(float octave) {
        vec2 offset = vec2(0.0);
        vec2 padding = vec2(10.0) / iResolution.xy;
        offset.x = -min(1.0, floor(octave / 3.0)) * (0.25 + padding.x);
        offset.y = -(1.0 - (1.0 / exp2(octave))) - padding.y * octave;
        offset.y += min(1.0, floor(octave / 3.0)) * 0.35;
        return offset;   
    }

    vec3 GetBloom(vec2 coord) {
        vec3 bloom = vec3(0.0);
        bloom += Grab(coord, 1.0, CalcOffset(0.0)) * 1.0;
        bloom += Grab(coord, 2.0, CalcOffset(1.0)) * 1.5;
        bloom += Grab(coord, 3.0, CalcOffset(2.0)) * 1.0;
        bloom += Grab(coord, 4.0, CalcOffset(3.0)) * 1.5;
        bloom += Grab(coord, 5.0, CalcOffset(4.0)) * 1.8;
        bloom += Grab(coord, 6.0, CalcOffset(5.0)) * 1.0;
        bloom += Grab(coord, 7.0, CalcOffset(6.0)) * 1.0;
        bloom += Grab(coord, 8.0, CalcOffset(7.0)) * 1.0;
        return bloom;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec3 color = ColorFetch(uv);
        
        color += GetBloom(uv) * 0.08;
        color *= 125.0;
        
        // Tonemapping and color grading
        color = pow(color, vec3(1.5));
        color = color / (1.0 + color);
        color = pow(color, vec3(1.0 / 1.5));
        
        color = mix(color, color * color * (3.0 - 2.0 * color), vec3(1.0));
        color = pow(color, vec3(1.3, 1.20, 1.0));    
        color = saturate(color * 1.01);
        color = pow(color, vec3(0.7 / 2.2));

        // Cool, restrained grading for the portfolio's event horizon.
        color *= vec3(0.64, 0.80, 1.0);
        FragColor = vec4(color, 1.0);
    }
    `;

    // --- WebGL Helper Functions ---

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl, vs, fs) {
        const program = gl.createProgram();
        const vShader = createShader(gl, gl.VERTEX_SHADER, vs);
        const fShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
        if (!vShader || !fShader) { gl.deleteProgram(program); return null; }
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        gl.deleteShader(vShader);
        gl.deleteShader(fShader);
        return program;
    }

    function createTexture(gl, size, generateContent) {
        const data = new Uint8Array(size * size * 4);
        generateContent(data, size);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return texture;
    }

    function createFBO(gl, width, height) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            gl.deleteTexture(tex); gl.deleteFramebuffer(fbo);
            throw new Error('Float framebuffer is not supported');
        }
        return { fbo, tex, width, height };
    }

    // Ext for float textures
    gl.getExtension("EXT_color_buffer_float");

    const progA = createProgram(gl, vsSource, bufferA);
    const progB = createProgram(gl, vsSource, bufferB);
    const progC = createProgram(gl, vsSource, bufferC);
    const progD = createProgram(gl, vsSource, bufferD);
    const progImage = createProgram(gl, vsSource, imagePass);
    if (![progA, progB, progC, progD, progImage].every(Boolean)) {
        canvas.remove();
        motionButton.querySelector('span').textContent = 'Still universe';
        return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0
    ]), gl.STATIC_DRAW);

    // Textures
    const noiseTex = createTexture(gl, 256, (data, size) => {
        for (let i = 0; i < size * size * 4; i += 4) {
            let val = Math.random() * 255;
            data[i] = val; data[i + 1] = val; data[i + 2] = val; data[i + 3] = 255;
        }
    });

    const colorTex = createTexture(gl, 256, (data, size) => {
        for (let i = 0; i < size * size * 4; i += 4) {
            data[i] = Math.random() * 255;
            data[i + 1] = Math.random() * 255;
            data[i + 2] = Math.random() * 255;
            data[i + 3] = 255;
        }
    });

    let fboA, fboB, fboC, fboD;

    // Scale down resolution to improve performance, this is a heavy shader
    const resolutionScale = matchMedia('(max-width: 600px)').matches ? 0.6 : 0.55;
    const deleteFBO = buffer => {
        if (!buffer) return;
        gl.deleteFramebuffer(buffer.fbo); gl.deleteTexture(buffer.tex);
    };

    function resize() {
        // limit max resolution for performance
        let w = scene.clientWidth * resolutionScale;
        let h = scene.clientHeight * resolutionScale;

        if (w > 1200) {
            h = h * (1200 / w);
            w = 1200;
        }

        w = Math.max(1, Math.floor(w));
        h = Math.max(1, Math.floor(h));

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            [fboA, fboB, fboC, fboD].forEach(deleteFBO);
            try {
                fboA = createFBO(gl, w, h);
                fboB = createFBO(gl, w, h);
                fboC = createFBO(gl, w, h);
                fboD = createFBO(gl, w, h);
            } catch {
                lost = true; canvas.hidden = true;
                scene.classList.remove('shader-ready');
                motionButton.disabled = true;
                motionButton.querySelector('span').textContent = 'Still universe';
            }
        }
    }
    resize();

    const centerX = () => matchMedia('(max-width: 600px)').matches ? 0.47 : 0.14;
    let targetMouseX = centerX();
    let targetMouseY = 0.5;
    let currentMouseX = centerX();
    let currentMouseY = 0.5;
    let mouseDown = 0;

    document.querySelector('.hero').addEventListener('pointermove', event => {
        if (paused || event.pointerType === 'touch') return;
        const bounds = scene.getBoundingClientRect();
        targetMouseX = centerX() + (event.clientX / innerWidth - 0.5) * 0.12;
        targetMouseY = 0.5 + ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.1;
    }, { passive: true });

    function setUniforms(program) {
        gl.useProgram(program);
        const locRes = gl.getUniformLocation(program, "iResolution");
        const locTime = gl.getUniformLocation(program, "iTime");
        const locMouse = gl.getUniformLocation(program, "iMouse");

        gl.uniform3f(locRes, canvas.width, canvas.height, 1.0);
        gl.uniform1f(locTime, elapsed);
        gl.uniform4f(locMouse, currentMouseX * canvas.width, currentMouseY * canvas.height, mouseDown, 0.0);

        const posLoc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    }

    function renderFrame() {
        if (!fboA || lost) return;
        currentMouseX += (targetMouseX - currentMouseX) * 0.08;
        currentMouseY += (targetMouseY - currentMouseY) * 0.08;

        // --- Pass A ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboA.fbo);
        gl.viewport(0, 0, fboA.width, fboA.height);
        setUniforms(progA);

        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, noiseTex);
        gl.uniform1i(gl.getUniformLocation(progA, "iChannel0"), 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, colorTex);
        gl.uniform1i(gl.getUniformLocation(progA, "iChannel1"), 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // --- Pass B ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);
        setUniforms(progB);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
        gl.uniform1i(gl.getUniformLocation(progB, "iChannel0"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // --- Pass C ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboC.fbo);
        setUniforms(progC);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fboB.tex);
        gl.uniform1i(gl.getUniformLocation(progC, "iChannel0"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // --- Pass D ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboD.fbo);
        setUniforms(progD);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fboC.tex);
        gl.uniform1i(gl.getUniformLocation(progD, "iChannel0"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // --- Image Pass (to Canvas) ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        setUniforms(progImage);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
        gl.uniform1i(gl.getUniformLocation(progImage, "iChannel0"), 0);
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, fboD.tex);
        gl.uniform1i(gl.getUniformLocation(progImage, "iChannel3"), 3);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        scene.classList.add('shader-ready');
    }
    function tick(now) {
        raf = 0;
        if (paused || document.hidden || !inView || lost) return;
        // A 30 fps cap keeps a background effect from consuming an entire GPU budget.
        if (now - lastFrame >= 1000 / 30) {
            elapsed += Math.min((now - lastFrame) / 1000, 0.05);
            lastFrame = now;
            renderFrame();
        }
        raf = requestAnimationFrame(tick);
    }
    function syncAnimation() {
        cancelAnimationFrame(raf); raf = 0;
        lastFrame = performance.now();
        if (!paused && !document.hidden && inView && !lost) raf = requestAnimationFrame(tick);
    }
    motionButton.disabled = lost;
    updateMotionButton();
    motionButton.addEventListener('click', () => {
        paused = !paused; updateMotionButton(); syncAnimation();
    });
    reducedMotion.addEventListener('change', event => {
        paused = event.matches; updateMotionButton(); syncAnimation();
    });
    document.addEventListener('visibilitychange', syncAnimation);
    const sceneObserver = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting; syncAnimation();
    }, { threshold: 0.01 });
    sceneObserver.observe(scene);
    let resizeRaf = 0;
    const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => { resize(); targetMouseX = centerX(); currentMouseX = centerX(); renderFrame(); });
    });
    resizeObserver.observe(scene);
    canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault(); lost = true; syncAnimation();
        canvas.hidden = true; scene.classList.remove('shader-ready');
        motionButton.disabled = true;
        motionButton.querySelector('span').textContent = 'Still universe';
    });
    renderFrame(); syncAnimation();
    window.addEventListener('pageshow', event => {
        if (event.persisted) { renderFrame(); syncAnimation(); }
    });
    window.addEventListener('pagehide', event => {
        cancelAnimationFrame(raf); cancelAnimationFrame(resizeRaf);
        if (event.persisted) return;
        sceneObserver.disconnect(); resizeObserver.disconnect();
        [fboA, fboB, fboC, fboD].forEach(deleteFBO);
        [noiseTex, colorTex].forEach(tex => gl.deleteTexture(tex));
        [progA, progB, progC, progD, progImage].forEach(program => gl.deleteProgram(program));
        gl.deleteBuffer(positionBuffer);
    }, { once: true });
});

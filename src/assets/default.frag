#ifdef GL_ES
precision mediump float;  // Set floating point precision to medium on mobile/WebGL ES
#endif

// Input uniforms provided by the rendering system
uniform vec2 u_resolution;        // Canvas size in pixels
uniform vec2 u_mouse;             // Mouse position in pixels
uniform float u_time;             // Time in seconds since shader started
uniform sampler2D u_webcam;       // Webcam texture sampler
uniform vec2 u_webcam_resolution;       // Webcam resolution in pixels
uniform float u_dpi;              // Controls the density of the halftone pattern
uniform float u_pattern_density;
uniform float u_radius_modulation; // Controls how much the halftone pattern is affected by brightness
uniform bool u_invert_pattern;     // Whether to invert the halftone pattern (0=normal, 1=inverted)

/**
 * Adjusts UV coordinates to maintain aspect ratio when mapping a texture to canvas
 * This ensures the image is "covered" properly without distortion
 * 
 * @param textureAR Aspect ratio of the texture (width/height)
 * @param canvasAR Aspect ratio of the canvas (width/height)
 * @param uv The original UV coordinates
 * @return Adjusted UV coordinates that maintain proper aspect ratio
 */
vec2 adjustUV(float textureAR, float canvasAR, vec2 uv) {
    bool isLandscape = canvasAR < textureAR;  // Check if the canvas is wider than it is tall relative to texture
    float scale = isLandscape ? canvasAR / textureAR : textureAR / canvasAR;  // Calculate scaling factor
    float x = !isLandscape ? uv.x : (uv.x - 0.5) * scale + 0.5;  // Center and scale X if needed
    float y = isLandscape ? uv.y : (uv.y - 0.5) * scale + 0.5;   // Center and scale Y if needed
    return vec2(x, y);  // Return adjusted coordinates
}

void main() {
    // Convert fragment coordinate to normalized [0,1] UV space
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Calculate aspect ratios for the webcam and canvas
    float videoAR = u_webcam_resolution.x / u_webcam_resolution.y;  // Webcam aspect ratio
    float canvasAR = u_resolution.x / u_resolution.y;    // Canvas aspect ratio

    // Adjust UVs to maintain proper aspect ratio using the "cover" approach
    vec2 adjustedUV = adjustUV(videoAR, canvasAR, uv);
    // Flip X coordinate to correct webcam mirroring
    adjustedUV.x = 1.0 - adjustedUV.x;

    // Set up pixelation effect for the webcam image
    vec2 pixelatedUv = adjustedUV;
    pixelatedUv = pixelatedUv * 2.0 - 1.0;  // Convert to [-1,1] range

    // Determine if the canvas is being cropped horizontally
    bool isCroppedHor = canvasAR < videoAR;

    // Calculate pixelated coordinates based on aspect ratio
    // This creates a blocky/pixelated look by quantizing the UV coordinates
    float pixelX1 = floor(((pixelatedUv.x + 1.) / 2.) * u_dpi) / (u_dpi);
    float pixelY1 = (floor(pixelatedUv.y * u_dpi / videoAR / 2.) / (u_dpi / videoAR / 2.) + 1.) / 2.;
    float pixelX2 = (floor(pixelatedUv.x * u_dpi * videoAR / 2.) / (u_dpi * videoAR / 2.) + 1.) / 2.;
    float pixelY2 = floor(((pixelatedUv.y + 1.) / 2.) * u_dpi) / (u_dpi);

    // Choose the appropriate pixelation based on the cropping direction
    float pixelX = isCroppedHor ? pixelX2 : pixelX1;
    float pixelY = isCroppedHor ? pixelY2 : pixelY1;

    // Sample the webcam texture with pixelated coordinates
    vec4 texel = texture2D(u_webcam, vec2(pixelX, pixelY));

    // Calculate brightness using standard luminance weights
    vec3 luma = vec3(0.2126, 0.7152, 0.0722);  // Standard RGB to luminance conversion weights
    float brightness = dot(texel.rgb, luma);   // Calculate perceived brightness

    // Apply color theme based on user selection
    vec3 color = vec3(0., 0., 0.75); 

    // Prepare UV coordinates for halftone pattern
    vec2 halftoneUv = uv;
    halftoneUv = halftoneUv * 2.0 - 1.0;  // Convert to [-1,1] range

    // Scale halftone pattern based on aspect ratio
    halftoneUv.x = isCroppedHor ? halftoneUv.x * u_resolution.x / u_resolution.y : halftoneUv.x;
    halftoneUv.y = isCroppedHor ? halftoneUv.y : halftoneUv.y * u_resolution.y / u_resolution.x;

    // Create a repeating grid for the halftone pattern
    float posOffX = isCroppedHor ? 0. : mod(u_dpi, 2.) / 2.;  // Offset X for even/odd DPI
    float posOffY = isCroppedHor ? mod(u_dpi, 2.) / 2. : 0.;  // Offset Y for even/odd DPI

    // Divide space into grid cells
    halftoneUv.x = fract(halftoneUv.x * u_dpi / 2. + posOffX);
    halftoneUv.y = fract(halftoneUv.y * u_dpi / 2. + posOffY);

    // Remap each grid cell to [-1,1] range
    halftoneUv = halftoneUv * 2.0 - 1.0;

    // Set parameters for the halftone effect
    float blur = u_dpi * 0.0025;  // Edge blur amount for the circles (scales with DPI)

    // Calculate circle radius based on brightness and modulation
    // Higher brightness = larger circles when modulation is less than 1
    float rad = (1. - u_radius_modulation + (brightness * u_radius_modulation)) * u_pattern_density;

    // Create a circle in each grid cell
    float d = length(halftoneUv);  // Distance from center of cell

    // Apply smoothstep to create a soft-edged circle
    d = smoothstep(rad - blur, rad + blur, d);

    // Apply pattern inversion if selected
    d = u_invert_pattern ? d : (1. - d);

    // Apply halftone pattern to the color
    color = color * d;

    // Output final color with original alpha
    gl_FragColor = vec4(color, texel.a);
}
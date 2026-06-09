# IDEA9103_UI-Maker
[Carlos / Shumin] Final Project Team - 8
jyan0098, yxie0608, yuli0835, lche0010
# Part 1: Project introductions and interaction instructions
## Welcome to the gallery

The curator of an art gallery invites you to be the **web designer** of this gallery.

The tool is very simple: the left column component - text box, picture, card, title, search box...  
You just need to drag them to the canvas on the right, combine them freely, and gradually set up a web page belonging to this art gallery.


> Please ignore the occasional slight...shake. There are always some minor problems with the new software.   

> The exhibits can be used for appreciation. But if you want to evaluate them, it's best to be in a place where they can't hear...


## How to use

- Choose a **element** from the component column on the left, **hold down** mouse and **drag** to the canvas on the right
- Freely place, combine, and set up the home page of the art gallery in your mind
- In the upper right corner, you can **choose a background music for the website** 
- There is a **refresh**, and you can rest over at any time.

A normal design tool should have it all.
It **should not be** ...



## About Those<span style="background-color: #000000; color: #000000;"> “Little Quirks”
    
<p><span style="background-color: #000000; color: #000000;">The longer you work and the more components you pile onto the canvas, the more this software starts to... have a mind of its own.
It unfolds in four stages, and the more you do, the faster it happens.

**Stage 1 <span style="background-color: #000000; color: #000000;">· Everything's Normal**
Clean, tidy, and obedient. Enjoy this time while it lasts.

**Stage 2 <span style="background-color: #000000; color: #000000;">· It Starts Zoning Out**
<span style="background-color: #000000; color: #000000;">Occasionally, a component will suddenly blur, as if you forgot to put on your glasses;
or it might twitch slightly toward your mouse, as if—it saw you. No big deal. Really.

**Stage 3 <span style="background-color: #000000; color: #000000;">· It Starts Growing**
<span style="background-color: #000000; color: #000000;">When the music plays, red and blue afterimages seep from the borders, and symbols that don’t belong creep into the text. Something begins to creep slowly along the components. This wasn’t in your design draft. But now it is.

**Stage 4 <span style="background-color: #000000; color: #000000;">· It No Longer Needs You**
<span style="background-color: #000000; color: #000000;">The components start sprouting vines everywhere. You want to clean it up. It’s already too late.

<span style="background-color: #000000; color: #000000;">At this point, the interface is out of control

---

## Things You Can<span style="background-color: #000000; color: #000000;">’t Delete

<span style="background-color: #000000; color: #000000;">You thought a simple refresh would reset everything.

<span style="background-color: #000000; color: #000000;">On the first refresh, the canvas is indeed clean.
<span style="background-color: #000000; color: #000000;">But starting with the second one, everything you delete leaves a faint trace in its place—
<span style="background-color: #000000; color: #000000;">a ghost that can’t be erased, quietly reminding you: it was once here.

<span style="background-color: #000000; color: #000000;">This art museum never truly forgets a single exhibit.

<span style="background-color: #000000; color: #000000;">> Enjoy designing~
</span>



---


## Project Path

Our group has chosen to create an original interactive piece.

## Project Inspiration

Our project explores the process of a digital interface gradually becoming unstable and developing organic behaviour. The current working title is “UI Maker…?”. At the beginning, the work appears as a clean UI-building environment where users can place interface components such as cards, buttons, and input fields onto a workspace, similar to designing a webpage or digital interface.

However, as the user continues interacting with the system, layouts and structures begin to distort. The interface gradually becomes covered with spreading dots, plant-like line structures (or other visual effects that achieve a similar feeling), and traces that cannot be fully removed. Over time, the system begins to behave in ways that no longer fully obey the user.

The project aims to create the feeling of “a user trying to build order while the system slowly grows out of control.” Visually, we are inspired by Yayoi Kusama and some glitch art games(e.g. Pony Island). 

>Yayoi Kusama, RED-NETS
<img src="assets/readme/ksmyyi.jpg" width="500">

>Yayoi Kusama, Obliteration Room
<img src="assets/readme/ksmyyi2.png" width="600">

>Pony Island
<img src="assets/readme/pony_island.jpg" width="600">




# Part 2: Mechanics

## Team Members and Mechanics

|   Team Member   | Mechanic                       | Branch                                                           |  
| --------------- | ------------------------------ | -----------------------------------------------------------------|
| [Liyifan Chen]  | Audio                          |                                                                  |
| [Yuxin Xie]     | Time-based                     |                                                                  |
| [Yutong Li]     | Perlin Noise & Randomness      | https://github.com/YL-zezhu/IDEA9103_UI-Maker-/tree/Perlin-Noise |
| [Jiayi Yang]    | User Input (and Art Direction) |                                                                  |

---

## Audio Mechanic

The audio mechanic use the treble, mid, and bass frequencies of the audio to control three different visual effects: hue shift, character glitch, and shaking. Since the treble, mid, and bass frequencies vary for each song, each has its own optimal mapping range.

---

## Time-based Mechanic

The time-based mechanic controls the system’s progression through different stages over time. At the beginning, the interface appears clean, organised, and easy to control. However, as time passes, the system gradually enters new states.

In the early stage, the interface behaves normally. Later, small distortions and layout shifts begin to appear. Eventually, spreading dots and plant-like structures start covering the workspace. The final stage becomes “irreversible,” where deleted components leave behind traces, ghost marks, or contaminated areas even after refreshing or resetting the interface.

This mechanic transforms the project from a controllable design environment into a system that appears to develop autonomous behaviour.

---

## Perlin Noise and Randomness Mechanic

The Perlin noise and randomness mechanic controls the system’s “organic growth” behaviour. Compared to rigid or mechanical movement, Perlin noise creates smoother and more natural motion. It will be used to control the movement of line structures, the spread of dots, background distortion, and the drifting motion of interface elements.

Randomness also makes the system’s growth unpredictable. Components may duplicate in different directions, some areas may become more heavily “infected” than others, and line structures may continue growing along changing paths.

The goal of this mechanic is to gradually transform the interface from a rational digital system into something that feels more like a living organism.

---

## User Input Mechanic

The user input mechanic allows users to interact with the system like a UI builder. Users can select components such as cards, buttons, icons, and input fields from a side panel and place them into the central workspace.

The interface may also include functions such as delete, refresh, or reset, encouraging users to continuously organise and clean the workspace.

However, as the system gradually loses stability, these actions become less effective. Deleted components may leave faint traces behind, while refreshing the interface may still leave ghost marks or traces of previous layouts.

This mechanic directly supports the project’s main theme: the user attempts to create order and control the interface, while the system slowly develops behaviour that no longer fully obeys the user.

---

# Part 3: Techniques

Object-oriented component structure:  
We used a `Component` class to manage different interface elements, including images, background images, cards, titles, text boxes, and search boxes. Each component stores its own position, size, type, outline segments, and display logic.

Event listener:  
`mousePressed()`, `mouseReleased()` and detect mouse moving to achieve user desgining interface.

Time and stage control:  
`Floor ()` cuts the total time into four stages.  
`Use map()` to change the basic time range to the abstract degree of corruption.  
`Constrain()` to limit the scope.

Hand-drawn shape generation:    
Use `beginShape()` and `endShape()` to connect generated points and create irregular hand-drawn forms instead of perfectly clean geometric shapes.

Image asset management:     
Use `loadImage()` and image arrays to preload exhibition images and background images, then assign them sequentially when users drag new image components onto the canvas.

perlin noise :  
Both `growDiffusion()` and `growTendrils()` use Perlin noise to generate smooth, organic variation — noise modulates dot radii in Stage 3 and continuously steers vine direction and branching in Stage 4.  
In our implementation, Perlin noise is connected to component-based growth, so corruption appears around user-placed components instead of as a separate background effect.

Procedural generation:  
Dots and vines are generated algorithmically each frame; border points are sampled with jitter so diffusion originates along component edges.

Rendering & data structures：   
Persistent off-screen layer (`createGraphics`) stores all marks; arrays of objects (`corruptionPoints`, `tendrilTips`) manage anchors and active vine tips; p5 primitives (`circle`, `line`, `strokeWeight`, `fill`, `image`) plus `lerp`, `map`, `constrain` control growth, opacity, and progression.

Audio:  
Use `p5. FFT` to handle low, medium and high frequencies of audio, so as to visualise audio dynamics.     
Use `loadSound()`, `analyse()`, `getEnergy()`: By analysing and seperating the low/medium/high frequency energy of music, the components can react to the rhythm of the music. 
`lerp()` smooths the frequency value of each frame. Make the reaction smooth and not jump every frame. 
`blendMode(ADD)` changes the blending mode to create a colour overlay effect and prevent the colour from being covered.     
Build an `array` for glitch chars. When outputting the characters in each text one by one, the audio-driven `glitchlevel` determines whether it becomes a glitch, and the `redlevel` determines whether it turns red.   


# Part 3: AI acknowledgement:

We used ChatGPT and Claude as supportive tools during the development of this project. Their assistance was limited to improving code clarity, suggesting fixes for merge‑related errors, providing guidance on GitHub workflows, and helping us shorten redundant sections of code into cleaner and more readable implementations. 

All core ideas, system design decisions, and the essential logic of the project were fully conceived and implemented by us.




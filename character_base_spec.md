# Character Base Spec v1

This document locks the approved base look for the default character before any clothing options.

## Reference Intent
- Resemblance target: middle-aged bald man from the approved photo set.
- Style target: stylized-semi-real (recognizable likeness, production friendly for interactive pose + wardrobe).
- Keep the face readable at game camera distance (not hyper realistic).

## Base Visual Identity
- Sex presentation: male.
- Apparent age: 45-55.
- Build: average, slightly soft around neck/jaw.
- Height feel: average.
- Head silhouette: high rounded bald crown with broad forehead.
- Face silhouette: oval-round with soft jaw corners.
- Skin: light fair, neutral-to-warm pink beige range.
- Eyebrows: thin-medium, low contrast.
- Eyes: light blue gray.
- Nose: medium width, straight bridge.
- Mouth: thinner upper lip, neutral mouth line.
- Ears: medium size, slightly visible from front.
- Hair: none on crown; optional very subtle side stubble only.
- Facial hair: clean shave default.
- Glasses: black rectangular full-rim as base accessory.

## Proportion Targets (Head-Units)
- Total character height: 7.25 head units.
- Shoulder width: 2.2 head widths.
- Neck height: 0.32 head units.
- Torso (neck base to crotch): 2.55 head units.
- Upper arm: 1.25 head units.
- Forearm: 1.15 head units.
- Hand length: 0.78 head units.
- Thigh: 1.65 head units.
- Calf: 1.55 head units.
- Foot length: 1.05 head units.

## Facial Landmark Targets
- Eye line: 0.46 down from crown to chin.
- Interpupillary distance: 0.44 head widths.
- Nose tip: 0.69 down crown-to-chin.
- Mouth center: 0.80 down crown-to-chin.
- Ear top aligns near eyebrow line.
- Ear bottom aligns near nose base.

## Color and Material Guidance
- Skin base: #D6B39A.
- Skin shadow: #BC967D.
- Skin highlight: #E4C5AF.
- Lip base: #A6786A.
- Brow tone: #6B564A.
- Eye iris: #7A8FA8.
- Glasses frame: #1E1E1E.
- Eye white tint: #ECEAE7.

## Expression Baseline
- Default expression: neutral, mildly serious.
- Eyelids: slightly heavy upper lids.
- Brow position: relaxed, no aggressive arch.
- Mouth corners: flat to very slight downturn.

## Modeling Rules
- Preserve likeness through head mass, eye spacing, and nose-mouth spacing first.
- Keep asymmetry subtle (left/right not perfectly mirrored).
- Do not exaggerate caricature features unless requested later.
- Keep topology clean around eyes, mouth, and jaw for posing and blend shapes.

## Deliverables for Base Model
- Front, 3/4 left, and side turnaround renders.
- Neutral pose model with no clothing overlays baked into body mesh.
- Separate glasses mesh (toggleable asset).
- Basic head blend shapes:
  - blink
  - brow raise
  - brow lower
  - mouth open
  - mouth narrow

## Acceptance Criteria
- Likeness is recognizable from front and 3/4 view.
- Silhouette remains identifiable without textures.
- Rig test can raise both arms, rotate torso, bend knees/elbows without mesh collapse.
- Glasses stay aligned during head rotation.

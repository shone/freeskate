# Freeskate

<img src="screenshot.png" style="width: 600px">

A [FreeCAD](https://www.freecad.org) model of a [JMK](https://www.jmkride.com) [Freeskate](https://en.wikipedia.org/wiki/Freeskates). The 3D model is viewable at [shone.dev/freeskate](https://shone.dev/freeskate)

## Holster

To get rail length: `App.getDocument("freeskate").getObjectsByLabel("rails-shape-binder")[0].Shape.Length`

| Name                        |   Length |      Bend | Mandril diameter | Actual diameter |
|-----------------------------|----------|-----------|------------------|-----------------|
| Wheel guard                 |  94.25mm |    180deg |                  |            60mm |
| Along truck left edge       |    100mm |           |                  |                 |
| Bend back                   |   15.7mm |    180deg |              9mm |            10mm |
| Back along truck left edge  |    153mm |           |                  |                 |
| Bend around deck            |   30.6mm |    180deg |             18mm |          19.5mm |
| Along deck                  | 112.25mm |           |                  |                 |
| Bend across deck            |   15.3mm |     90deg |             18mm |          19.5mm |
| Across deck                 |  40.50mm |           |                  |                 |
| Bend back along deck        |   15.3mm |     90deg |             18mm |          19.5mm |
| Back along deck             | 112.25mm |           |                  |                 |
| Bend around deck            |   30.6mm |    180deg |             18mm |          19.5mm |
| Along truck right edge      |    153mm |           |                  |                 |
| Bend back                   |   15.7mm |    180deg |              9mm |            10mm |
| Back along truck right edge |     30mm |           |                  |                 |
| Bend catch into truck       |      2mm |  23.75deg |              9mm |            10mm |
| Ramp into truck             |  35.57mm |           |                  |                 |
| Bend back out of truck      |   9.93mm | 113.75deg |              9mm |            10mm |
| Catch edge                  |     12mm |           |                  |                 |
| Catch handle angle          |   4.36mm |     50deg |              9mm |            10mm |
| Catch handle                |     18mm |           |                  |                 |

## Rod bending

6mm stainless steel rod, bent 180 degrees around an 18mm diameter mandril resulted in an actual inner bend diameter of 19.5mm (outer diameter ~32mm). The actual bend diameter is larger than the mandril due to spring-back of the stainless steel material. Also, to acheive a 180 degree bend the rod must be bend back onto itself so that it touches and then bent even a bit further.

| Material                | Bend    | Mandril diameter | Actual bend diameter (inner) | Actual bend diameter (rod center) |
| ----------------------- | ------- | ---------------- | ---------------------------- | --------------------------------- |
| 6mm Stainless steel rod | 180 deg |             18mm |                       19.5mm |                            25.5mm |
| 6mm Stainless steel rod | 180 deg |              9mm |                       10.0mm |                            16.0mm |

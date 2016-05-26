# Data Analyst Nanodegree Project 6 - Visualize Electric Car Battery Performance in D3.js
![Comic Logo of this Udacity Project][dand-comic]

## Summary

Hybrid and fully electric cars are awesome because they will help us save the planet from burning through more dinosaur juice! But temperature of the battery and the way of driving your car is very important in order to have a long-lasting battery with which you can drive over a long range. This Data Analyst Nanodegree Visualization Project shows how electric car batteries State-of-Charge diminishes or increases and how the temperature of such a battery develops during different driving situations. The visualization was created with scrambled R&D data from a german car manufacturer and also contains options to drill down into an explorative mode which will be used by roughly 200 researchers in the field.

## Design

For my 6th Udacity Data Analyst Nanodegree Project I wanted to "go big" and involve a collegue from my workplace, a larger german car manufacturer who had some electric car battery data he wanted me to visualize. Many students in my home country aspire to create their final study project or thesis together with a company and the reward is that people may actually use the product that they develop during the course of a few months. I wanted to take that chance for this Nanodegree as well.

Similarly, the code of this visualization application will be re-used with varying data by engineers in the R&D department of my company. The challenge, of course, was that I had to design with a larger scope and additional stakeholders in mind. But data visualization is a topic dear to my heart (what is the use of all the data in the world if you cannot communicate it?). Also, web application development was my profession 5 years ago - so I was eager to see what had changed in the meantime. I jumped right into it!

### Initial Design Principles

The design was led by the following requirements. I order them roughly by granularity from the initial high-level requirements (which may not necessarily be about the visual layout) to the low-level design decisions (that often include decisions about specific visual encodings):

// TODO: initial design choices //

### Changes after Feedback

The following changes were applied after gathering feedback from a public audience. See [Actionable Feedback][actionable-feedback] for their justification and [Feedback Methodology][feedback-methodology] for a :

* CHG-1: Changed the text content of the visualization to state more clearly what we mean if we talk about "battery performance" - what makes a good electric car battery?
* CHG-2: While the scatterplot compares two dimensions, Temperature and State-of-Charge, the third dimension, "time", that gives those scatter plot points an order to be drawn in and the trail of scatter scatter points a direction. Initially, I tried highlighting this by marking the time point "190 seconds" in the data in order to make the three data sets comparable. Appearantly this was not enough so I added a small arrow next to every data series to hint at the directionality.
* CHG-3: The axes labels were changed from "Temperature" to "Mean Temperature of Electric Car Battery" and from "State-of-Charge" to "State-of-Charge of Electric Car Battery".
* CHG-4: In order to make the image more appealing and provide a first-moment eye catcher about the subject matter, little sticker-images have been added on the scatter plot canvas for every data series.
* CHG-5: The data is obfuscated with a fake-factor and -offset since it was sourced from a corporation and I could not compromise intellectual property. In order not to let people jump to wrong conclusions, an additional disclaimer was added.
* CHG-6: Instead of flashing boxes highlighting certain areas of a chart I am using more modest, dashed rectangles now.   

## Feedback

### Feedback Methodology

Early, when fleshing out the idea and design, I consulted the Udacity Forum with a [YouTube Pitch][youtube-pitch] and a [Discussion thread in the Forums][forum-pitch]. The advice given there guided me to not only focus on the explorative visualization but actually design a comparative overview over all battery scenarios that I was supplied with. Unfortunately I ended up with only a subset of the data that I wanted to consider initially, so I could not, for example, compare different battery types. Instead, I focussed on the behaviour of batteries in different driving situations.

Throughout the project, I was in touch with a electric car R&D experts who advised me on certain technical concepts and who gave feedback on the documented texts and visuals. During this development phase the project went through many iterations and changes concerned mainly technical details. You can check out the [Work-in-Progress][wip] section below to get an idea about this initial back-and-forth.

After the visualization reached the maturity of a release candidate, I requested feedback via a few public channels:

* Interviewing a Udacity Coach (subject A)
* Interviewing uninvolved collegues at work (1 critiques, subject B)
* Emailing friends and family as well as posting the visualization on facebook (2 critiques, subject C & D)
* Creating a [video walkthrough on YouTube][youtube-rc] and posting it on the [Udacity Forums][forums-rc] (no critiques)
* Posting a [link on my twitter][tweet] (no critiques)

Subjects were encouraged to use a prepared [Google Form][form] but only one participant (subject D) did so ([and here are his answers][form-subject-D])

### Actionable Feedback
<a name="actionable-feedback" />

The following table summarizes the feedback given by 4 individuals (A-D) during the "review phase" of the release candidate.

| Subject | Short Description     | Details          | Decision    | Change No. |
|---------|-----------------------|------------------|-------------|------------|
| A       | **What Does 'Performance' Actually Mean?** | Please change the introductory sentence - it is not clear what is ment with "performance" of batteries. | Decision: Changing the introductory sentence from "Hybrid and fully electric cars are awesome because they will help us save the planet from burning through more dinosaur juice! But temperature of the battery and the way of driving your car can influence the batteries performance" - to - "Hybrid and fully electric cars are awesome because they will help us save the planet from burning through more dinosaur juice! But temperature of the battery and the way of driving your car is very important in order to have a long-lasting battery with which you can drive over a long range." | CHG-1 |
| B, C     | **Confused by the '190s' Markers.** | The '190s' markers on the summary visualization are very confusing. We do not know what those mean. | Those markers should show that this is the point at which 190 seconds of the experiments passed and, therefore, make the three experiments comparable and also provide a visual clue about the directionality of the data series. I made this point clearer by adding an arrow to hint at the directionality of the data. I also spelled "seconds" out to make that abbreviation more understandable. | CHG-2 |
| C        | **Needed 3 Minutes to Understand What to Look at First.** | Subject is not an expert of car batteries: "It took me 3 minutes to understand what to look at first. My first glimpse fell on the axes, please state more clearly, about what kind of temperature you are talking about." | I changed the axis label (3) and added catchy images (4) to signify that we are talking about electric car batteries so that the message is more clear. | CHG-3, CHG-4 |
| C        | **Very Simplistic - But I Did Not Feel Encouraged to Interact Very Much.** | I only realized at the end that I can hover with my mouse over the chart. The whole chart does not make me want to interact with the graph very much. | Concerning mouseover and zooming / dragging I have taken no action. Those interaction techniques are more explorative and "on-demand" and should not get in the way of the main visualization. | none |
| C, D     | **Different initial State-of-Charges - Why?** | We do not understand why the SoCs start of at so different levels for the different batteries. Or: the overall relationship between the data sets remains unclear. | In order to protect intellectual copyright of Daimler AG, the individual series are obscured by a scaling factor and translating offset. That is why the State-of-Charge is different. Generally, you cannot trust the exact numbers, just the patterns and trends in every single scenario. I added this as a disclaimer. | CHG-5 |
| C        | **Flashy Boxes are Distracting** | Highlighting the areas we are talking about with flashy boxes distracts from the text of the story big time. | Used another style to draw those boxes: thick dashed outlines. | CHG-6 |
| D        | **Suggesting to add Projections for State-of-Charge** | I suggest adding a projection for every state of charge: how much faster do you run out of battery during winter in comparison with normal driving? | This would be a fun thing to do, but both scenarios need to have the same obfuscation factors / offsets in order to be comparable that way (see 'Different initial State-of-Charges - Why?'). Also, adding the functionality for this would be an effort much greater than feasible for the scope of this project. | <a name="chg7" /> CHG-7\* |
Footnote (\*): CHG-7 is not implemented at this stage since they would have exceeded project timeline and/or feasibility. They might be implemented as future work.

### Work in Progress
<a name="wip" />

| Screenshot | Date / Link to Snapshot | Description |
|------------|:-----------------------:|-------------|
| ![Initial Sketches][sketches-initial] | [28 Feb 2016][sketches-initial-pdf] | Initial meeting with my friend, the battery expert, to discuss the project and brainstorm ideas. Quite a few sketches came out of that. |
| [![Youtube Video](https://img.youtube.com/vi/WeySfLkMOio/0.jpg)](https://www.youtube.com/watch?v=WeySfLkMOio) | [14 Mar 2016][youtube-pitch] | **YouTube pitch for the [Udacity Forum][forum-pitch]:** After meeting with my friend and fleshing out ideas, I was asking for feedback from the nanodegree community & coaches.  |
| ![Screenshot 01][screenshot-01] | [13 Apr 2016][snapshot-01] | **Fail:** Using dimple.js as the library for the graph components; realizing that there is no option for me to make these components interactable in any meaningful way, so I will need to design the charts from scratch. |
| ![Screenshot 02][screenshot-02] | [18 Apr 2016][snapshot-02] | Components talking to each other! The battery schematic updates when you move the mouse over the chart; also the layout is more responsive; no thought spent yet on actual real-life data or how to de-clutter the UI. |
| ![Screenshot 03][screenshot-03] | [26 Apr 2016][snapshot-03] | Removed "clutter", made layout more responsive and added a whole deal of interactivity; what did not work in the end: to use the colored gradient as a stroke for the linegraph – too confusing! Instead the color mapping it is now shown as a guide on the y axis & on the data points. |
| ![Screenshot 04][screenshot-04] | [29 Apr 2016][snapshot-04] | Added the storybox, interactivity and cleaned up the site layout, navigation and structure. |
| ![Screenshot 05][screenshot-05] | [02 May 2016][snapshot-05] | **Fail:** A weird way of setting up an explanatory visualization comparing multiple batteries and displaying every battery in some strange bubbles There was a delay in the final "real-life" battery data being supplied and finally I was reaching a point where I desperately needed it to make design decisions! |
| ![Screenshot 06][screenshot-06] | [04 May 2016][snapshot-06] | Integrated first real-life battery + mockup of battery drawing into explorative view; Result: the graphs behaved really, really slow with the many additional data-points – programming of the event handlers was not performant at all! Also, in order to draw the lines with gradients, the lines had to be split into many segments leading to a very huge DOM. |
| ![Screenshot 07][screenshot-07] | [04 May 2016][snapshot-07] | The graphs are performant now - but: many outliers which make the data look ugly. We do have to do some wrangling :/ Also: the segment-wise drawing of the data in order to make their stroke use gradients makes the lines look "broken". |
| ![Screenshot 08][screenshot-08] | [07 May 2016][snapshot-08] | Added 2 other scenarios and re-styled the gradient functionality. Also added the interactivity in the schematic visualization. |
| ![Screenshot 09][screenshot-09] | [13 May 2016][snapshot-09] | Re-designed the exploratory visualization and requested further feedback from a subject-matter-expert. |
| ![Screenshot 10][screenshot-10] | [17 May 2016][snapshot-10] | **Release Candidate:** Added markers, annotations etc. etc., completed story - except for minor feedback from other people than the subject-matter-expert, this is the final project. The rest was bug fixing, refactoring for maintainability, commenting, documenting and asking other people for feedback. |
| ![Work-in-Progress Sketches][sketches-wip] | [14 Mar - 17 May 2016][sketches-wip-pdf] | Of course, also during the course of this project a few sketches and notes were taken - mainly for myself. |
| [![Youtube Video](https://img.youtube.com/vi/4cP_gmFC6Vc/0.jpg)](https://www.youtube.com/watch?v=4cP_gmFC6Vc) | [22 May 2016][youtube-rc] | **Request For Feedback in the [Udacity Forum][forum-rc]:** The project was at a high enough maturity that I could come back to the Nanodegree Community and ask for feedback. |
| ![Screenshot 11][screenshot-11] | [26 May 2016][snapshot-now] | **First Submission:** Incorporated all public feedback (see above), finished technical and project documenation and submitted project to Udacity. |

### Retrospective

Here are some challenges and lessons learned I would take into account if I were to re-start the project:

* A problem turned out to be the supply of data: I was starting to design the application long before I even had some real data! Therefore I had to "guess" what chart type would be most applicable in the final explanatory visualization. Luckily a scatter plot worked out just fine. The ``AppChart`` class I designed for the explorative visualization needed just some minor adaptations. If that wasn't possible I would
* The data is stored in JSON files in a very "quick & dirty" way. The JSON files store the values alongside with directives for data display, decorative elements like annotations, markers etc. This does not obey a clear separation of concerns.
* Generally, the duck typing of Javascript led me to write much redundant code that assumes certain data structure all over the place. There is, e.g., no typed data model with methods and prototypes for the input data. Instead, the data is just read as-is from the JSON files. For a future work, this could be further professionalized.
* The obfuscation of the data values in order to protect intellectual property basically makes quantitative statements on the explanatory visualization useless. The visualization states battery temperatures at about 70°C or higher, which is not realistic - rather confusing. I added a disclaimer as a workaround. However, one could also envision a visualization that simply hides any quantitative data on its axes.

Of course, if I had the chance to play around with un-obfuscated or additional data, I could realize many more cool visualizations (like the projection described in [CHG-7][chg7]).

## Technical Documentation

The source code of this project is thouroughly documented but before diving into the comments of the source code, I recommend getting a high level understanding about some concepts that are mentioned throughout the sourcecode. I supply some ["tutorial" documents alongside with a JSDoc documentation][doc]:

* [File & Directory Structure][doc-1FileDirectoryStructure] contains a general "what is where" of the repository.
* [Terminology][doc-2Terminology] describes a number of clearly defined concepts you see on the screen of the application.
* [JSON Class Structure of Data Files][doc-3JSONDataStructure] contains the file structure of the visualized data and may be especially useful for readers that want to swap out the dataset with other data.
* [Components of the Application][doc-4Components] describes the components you see on the web application. This application uses [AngularJS][angularjs], a framework that lets us define "extensions" to HTML and attach custom behaviours to those new elements. For drawing the charts, dropdowns, battery schematics etc. this is heavily used.
* [Interaction of the Components][doc-5ComponentsInteraction] explains how the components described above exchange data so they all update simultaneously and thusly provide a consistent user experience.
* [Layers in the AppChart D3.js Graph][doc-6LayersAppChart] goes into deeper detail about how our chart implementation's internal SVG layering is designed so that all small things of the chart, like axes, labels, data points etc. all fall into place at the right position.

For separation of concerns and for convenience of the **Udacity Data Analyst Nanodegree graders**, all [d3.js][d3js] code is encapsulated in one single Javascript class ``AppChart`` which is placed in ``js/AppChart.js``. Understanding the source code in this file should not require any knowledge of [AngularJS][angularjs].

## Ressources

### Interesting Articles / Tutorials / Showcases

* [How to develop D3.js in AngularJS](http://briantford.com/blog/angular-d3)
* [D3 Reusable Bar Chart with AngularJS](http://bl.ocks.org/biovisualize/5372077)
* [D3 Example: Zoom, Pan and Axis Rescale](http://bl.ocks.org/stepheneb/1182434)
* [D3: Continuous Color Scales with Many Color Values](http://stackoverflow.com/questions/17671252/d3-create-a-continous-color-scale-with-many-strings-inputs-for-the-range-and-dy)
* [Coloring Different Segments of a Line Chart](http://fiddle.jshell.net/4xZwb/3/) (interesting, but I abandoned the idea)
* [SVG Paths With Percentages as Sizes and Fixed Stroke Widths](http://codepen.io/gionkunz/pen/KDvLj)

### Frameworks Used & Copyrights

* [Bootstrap][bootstrap] ([MIT License][bootstrap-license])
* [Bootstrap Sass][bootstrap-sass]
* [jQuery][jquery] ([MIT License][jquery-license])
* [AngularJS][angularjs] ([MIT License][angularjs-license])
* [D3.js][d3js] ([BSD License][d3js-license])
* [Requirejs][requirejs] ([New BSD or MIT License][requirejs-license])
* [Underscore][underscore] ([License][underscore-license])
* [JSDoc][jsdoc] ([Apache License 2.0][jsdoc-license])
* [JSDoc Bootstrap / Docstrap][docstrap] ([License][docstrap-license])
* [ElementQueries, ResizeSensor][elementqueries]

For development:

* [Grunt][grunt]
* [NodeJS][nodejs]
* [grunt-contrib-requirejs][grunt-contrib-requirejs]
* [grunt-jsdoc][grunt-jsdoc]
* [Jade][jade]
* [Sass][sass]


<!-- External Own Content -->
[tweet]: https://twitter.com/qwertzuhr/status/734362586712526850
[youtube-pitch]: https://www.youtube.com/watch?v=WeySfLkMOio
[forum-pitch]: https://discussions.udacity.com/t/visualizing-electric-car-battery-performance-feedback-request-on-project-idea/160501
[youtube-rc]: https://www.youtube.com/watch?v=4cP_gmFC6Vc
[forum-rc]: https://discussions.udacity.com/t/visualizing-electric-car-battery-performance-almost-done-sharing-requesting-feedback/169633
[form]: https://docs.google.com/forms/d/1QYO6jHJhTl4bjxkh0eHk51biyYBS2C5d_fYuI3cYiVo/viewform

<!-- External Content: Frameworks -->
[d3js]: https://d3js.org/
[d3js-license]: https://opensource.org/licenses/BSD-3-Clause
[angularjs]: https://angularjs.org/
[angularjs-license]: https://github.com/angular/angular.js/blob/master/LICENSE
[bootstrap]: http://getbootstrap.com/
[bootstrap-license]: https://github.com/twbs/bootstrap/blob/master/LICENSE
[bootstrap-sass]: https://www.npmjs.com/package/bootstrap-sass
[jquery]: https://jquery.com/
[jquery-license]: https://tldrlegal.com/license/mit-license
[requirejs]: http://requirejs.org/
[requirejs-license]: https://github.com/requirejs/requirejs/blob/master/LICENSE
[underscore]: http://underscorejs.org/
[underscore-license]: https://github.com/jashkenas/underscore/blob/master/LICENSE
[jsdoc]: http://usejsdoc.org/
[jsdoc-license]: http://usejsdoc.org/about-license-jsdoc3.html
[docstrap]: https://github.com/docstrap/docstrap
[docstrap-license]: https://github.com/docstrap/docstrap/blob/master/LICENSE.md
[elementqueries]: https://github.com/marcj/css-element-queries
[elementqueries-license]: https://github.com/marcj/css-element-queries/blob/master/LICENSE

[grunt]: http://gruntjs.com/
[nodejs]: https://nodejs.org/en/
[grunt-contrib-requirejs]: https://github.com/gruntjs/grunt-contrib-requirejs
[grunt-jsdoc]: https://github.com/krampstudio/grunt-jsdoc
[jade]: http://jade-lang.com/
[sass]: http://sass-lang.com/

<!-- Links to previous commits -->
[snapshot-01]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/0f270bf58721d37fc8f672e5e68c704318f857fb/index.html
[snapshot-02]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/0f270bf58721d37fc8f672e5e68c704318f857fb/index.html
[snapshot-03]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/ade394df185b6ba1d1a73e516014b6d659b54864/index.html
[snapshot-04]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/52bab2b0137ae3832838bcd71a4dd2815b9f9f42/index.html#!/explore?scenarioId=sample&storyId=peak
[snapshot-05]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/8612ed4aba025b4436172955e9545cecaad7b84f/index.html#!/explain
[snapshot-06]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/f9ae5632b3007172c434cf5a1c08d04eea5ab85a/index.html#!/explore?scenarioId=MeasBoostNSlowEMode&storyId=peak
[snapshot-07]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/c706442b6e91d1728cc9d86855887cbdccdf7271/index.html#!/explore?scenarioId=MeasBoostNSlowEMode&storyId=peak
[snapshot-08]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/9167bd3981ae42848bb6773e0eb6111037737741/index.html#!/explore?scenarioId=NEFZ&storyId=peak
[snapshot-09]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/9af784fa02ae9964971c565ff0d3b8d76f92d3ef/index.html#!/explain?showStories=0
[snapshot-10]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/a4ea71606374418c116f0b2abae4dd792f8240bf/index.html#!/explain?showStories=14

<!-- Anchors -->
[actionable-feedback]: #actionable-feedback
[wip]: #wip
[chg7]: #chg7

<!-- Images to be displayed on Markdown file -->
[dand-comic]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/images/dand6_comic_normal.png
[screenshot-01]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_01.png
[screenshot-02]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_02.png
[screenshot-03]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_03.png
[screenshot-04]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_04.png
[screenshot-05]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_05.png
[screenshot-06]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_06.png
[screenshot-07]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_07.png
[screenshot-08]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_08.png
[screenshot-09]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_09.png
[screenshot-10]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_10.png
[screenshot-11]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/screenshot_11.png
[sketches-initial]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/sketches_initial.png
[sketches-wip]: http://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/sketches_initial.png

<!-- Links to raw files of current repo commit -->
[snapshot-now]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/index.html
[form-subject-D]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/subject_D_redacted.pdf
[sketches-initial-pdf]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/sketches_initial.pdf
[sketches-wip-pdf]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/readme/sketches_wip.pdf
[doc]: https://rawgit.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/master/doc/index.html
[doc-1FileDirectoryStructure]: (https://rawgit.com/benjaminsoellner/doc/tutorial-1FileDirectoryStructure.html)
[doc-2Terminology]: (https://rawgit.com/benjaminsoellner/doc/tutorial-1FileDirectoryStructure.html)
[doc-3JSONDataStructure]: (https://rawgit.com/benjaminsoellner/doc/tutorial-1FileDirectoryStructure.html)
[doc-4Components]: (https://rawgit.com/benjaminsoellner/doc/tutorial-1FileDirectoryStructure.html)
[doc-5ComponentsInteraction]: (https://rawgit.com/benjaminsoellner/doc/tutorial-1FileDirectoryStructure.html)
[doc-6LayersAppChart]: (https://rawgit.com/benjaminsoellner/doc/tutorial-1FileDirectoryStructure.html)

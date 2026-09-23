// The founder's story, shared by the About page and the Home page.
// Text is the founder's own words; edit it here and both pages update.
import founderWithPotter from '../assets/story/founder-with-potter.jpeg'
import founderRoadsideChat from '../assets/story/founder-roadside-chat.jpeg'
import potterAtStall from '../assets/story/potter-at-stall.jpeg'
import roadsideMugs from '../assets/story/roadside-mugs.jpeg'
import roadsidePlates from '../assets/story/roadside-plates.jpeg'

export const founder = {
  name: 'Hriday Sharma',
  role: 'Founder, Potters Central',
}

// `position` keeps the subject in frame when a photo is cropped to fit.
export const storyPhotos = {
  founderWithPotter: {
    src: founderWithPotter,
    alt: 'Hriday Sharma sitting on a charpai beside a Khurja potter, showing him something on a phone',
    caption: 'Conversations with Khurja potters on the outskirts of Gurgaon.',
    position: '50% 45%',
  },
  founderRoadsideChat: {
    src: founderRoadsideChat,
    alt: 'Hriday Sharma standing at the roadside, showing a potter something on his phone',
    caption: 'Talking through the idea of a shopfront that never closes.',
    position: '55% 15%',
  },
  potterAtStall: {
    src: potterAtStall,
    alt: 'A potter seated beside his stall of glazed ceramics under a blue tarpaulin, a child standing next to him',
    caption: 'A Khurja potter at his roadside stall.',
    position: '65% 15%',
  },
  roadsideMugs: {
    src: roadsideMugs,
    alt: 'Rows of colourful ceramic mugs beside hand-painted floral lanterns and vases',
    caption: 'Hand-painted pieces and mugs, stacked by the roadside.',
    position: '50% 50%',
  },
  roadsidePlates: {
    src: roadsidePlates,
    alt: 'Stacks of speckled and glazed ceramic plates in muted colours, with painted serving trays below',
    caption: 'Stacks of plates, waiting for someone to stop.',
    position: '50% 40%',
  },
}

// Order of the photo carousel on the About page.
export const founderCarouselPhotos = [
  storyPhotos.founderWithPotter,
  storyPhotos.founderRoadsideChat,
  storyPhotos.potterAtStall,
  storyPhotos.roadsideMugs,
  storyPhotos.roadsidePlates,
]

export const aboutFounder = {
  eyebrow: 'About',
  greeting: "Hi, I'm Hriday Sharma.",
  opening: "This whole thing started because I couldn't stop asking questions.",
  paragraphs: [
    "I'm a high schooler with roughly forty mental tabs open at any given moment, and I've made peace with it. The tabs are all just genuinely interesting. Economics. Finance. Statistics. History. Geopolitics. Culture. I keep them open because I want to know how the world is actually wired: who decides what things are worth, why some ideas travel and others don't, and what it would take to change any of it.",
    "Most of what I do is the same loop on repeat. Get curious, read too much, then try to make something out of it. I write about economics and statistics. I argue my case (sometimes with actual judges) in essay competitions. I've done internships and programmes to see how businesses really run, not just how textbooks say they do. I build technology projects. I even wrote a book explaining economics to kids, partly because I think people should get to understand this stuff early, and partly because if you can explain something to a nine-year-old, you probably understand it yourself.",
  ],
  thesis: 'The thread through all of it: an idea only gets interesting once it does something. A clever concept sitting on a page bores me. I want to know whether it holds up when it meets a real person with a real problem.',
  closing: 'Which is exactly how this website happened.',
}

export const firstConversation = {
  number: '01',
  title: 'First Conversation',
  lead: "It didn't start with a business plan. It started with a Sunday.",
  paragraphs: [
    "For years I'd driven past potters selling ceramics on the outskirts of Gurgaon, the way you pass anything often enough that you stop really seeing it. Stacks of pots by the roadside, part of the scenery. Then one Sunday I actually stopped, and a few hours turned into something I didn't expect.",
    "Because these weren't just roadside sellers. I'd wandered into the edge of a story roughly 600 years long. They were Khurja potters, part of a migrant community that has been shaping and firing clay since long before any of the cities they now sell on the outskirts of existence. If you don't know Khurja, it's earned the nickname the Ceramic City, and the skill sitting by that Gurgaon roadside had travelled a very long way, across a very long time, to get there.",
    "And it was struggling. The same worry kept coming up as we talked: their craft had stayed almost entirely offline while everyone's buying habits moved online. The work was extraordinary. The reach was shrinking. They didn't need a lecture on digital transformation.",
  ],
  pullQuote: "They needed a shopfront that didn't close when the roadside did.",
  transition: 'So I asked the obvious, slightly naïve question:',
  // The question itself. It shows as a large pull quote once filled in.
  question: '',
  facts: [
    { value: '~600', unit: 'years', label: 'A story roughly 600 years long' },
    { value: 'Khurja', unit: '', label: 'Nicknamed the Ceramic City' },
    { value: 'Gurgaon', unit: '', label: 'Where the roadside stalls stand today' },
  ],
}

export const arrival = {
  number: '02',
  title: 'Arrival of Contemporary Technology & Traditional Art',
  paragraphs: [
    "This website is my attempt at an answer. A digital shopfront where Khurja's potters can show their work to people who'll never physically drive past that stretch of road and reach them anyway.",
    'The bigger hope is simple. Help these artisans sell more and keep a 600-year-old craft alive, and introduce the rest of the world to something worth knowing: pots shaped by hand, on a wheel, the slow way, finally findable the fast way.',
    "For me, it's the clearest example of the thing I actually care about. Not just building something, but using an idea to solve a problem that matters to real people.",
  ],
}

// Demo data for Hirely. WARNING: wipes every collection first.
// Run with: npm run seed  (uses MONGO_URI from server/.env unless set in the shell)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Gig = require('../src/models/Gig');
const Bid = require('../src/models/Bid');
const Review = require('../src/models/Review');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const Notification = require('../src/models/Notification');

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days) => new Date(Date.now() + days * DAY);
const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);

const seed = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing. Copy server/.env.example to server/.env and fill it in.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Seeding ${mongoose.connection.name} ...`);

  const models = [User, Gig, Bid, Review, Conversation, Message, Notification];
  await Promise.all(models.map((model) => model.deleteMany({})));
  await Promise.all(models.map((model) => model.init())); // make sure indexes exist (unique email, text search)

  // ---- Users (User.create runs the pre-save hook, so passwords are hashed) ----
  await User.create({ name: 'Hirely Admin', email: 'admin@hirely.dev', password: 'admin123', role: 'admin' });

  const priya = await User.create({
    name: 'Priya Sharma',
    email: 'priya@client.dev',
    password: 'password123',
    role: 'client',
    headline: 'Founder of a small skincare brand',
    bio: 'I run Glow & Co., a D2C skincare label from Bengaluru. I hire freelancers for design, web and marketing work.',
    location: 'Bengaluru',
  });
  const rahul = await User.create({
    name: 'Rahul Verma',
    email: 'rahul@client.dev',
    password: 'password123',
    role: 'client',
    headline: 'Product manager at an ed-tech startup',
    bio: 'Building learning tools for students preparing for competitive exams. Always looking for reliable freelancers.',
    location: 'Pune',
  });

  const aman = await User.create({
    name: 'Aman Gupta',
    email: 'aman@freelancer.dev',
    password: 'password123',
    role: 'freelancer',
    headline: 'Full-stack MERN developer',
    bio: 'I build fast, responsive web apps with React and Node.js. Four years of freelance work for startups and small businesses.',
    skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript'],
    hourlyRate: 900,
    location: 'New Delhi',
  });
  const neha = await User.create({
    name: 'Neha Iyer',
    email: 'neha@freelancer.dev',
    password: 'password123',
    role: 'freelancer',
    headline: 'UI/UX and brand designer',
    bio: 'I design clean interfaces and brand identities. I start every project with a short call to understand your users.',
    skills: ['Figma', 'UI Design', 'Branding', 'Illustrator', 'Prototyping'],
    hourlyRate: 750,
    location: 'Chennai',
  });
  const karan = await User.create({
    name: 'Karan Mehta',
    email: 'karan@freelancer.dev',
    password: 'password123',
    role: 'freelancer',
    headline: 'Content writer and SEO specialist',
    bio: 'I write well-researched blog posts and website copy that rank on Google and read like a person wrote them.',
    skills: ['SEO', 'Copywriting', 'Blog Writing', 'Content Strategy'],
    hourlyRate: 600,
    location: 'Jaipur',
  });

  // ---- 5 open gigs across categories ----
  const [landingPage, , onboardingFlow, blogPosts] = await Gig.create([
    {
      client: priya._id,
      title: 'Build a responsive product landing page in React',
      description:
        'We are launching a new vitamin C serum and need a fast, mobile-first landing page. It should have a hero section, ingredient highlights, customer reviews and a buy button that links to our existing store. Designs are ready in Figma.',
      category: 'Web Development',
      skills: ['React', 'CSS', 'Responsive Design'],
      budget: 25000,
      deadline: daysFromNow(21),
    },
    {
      client: priya._id,
      title: 'Plan a one-month Instagram content calendar',
      description:
        'Looking for a marketer to plan 30 days of Instagram posts and reels for our skincare brand. Include post ideas, captions, hashtags and the best times to post for an Indian audience aged 20 to 35.',
      category: 'Marketing',
      skills: ['Social Media', 'Content Strategy', 'Instagram'],
      budget: 12000,
      deadline: daysFromNow(14),
    },
    {
      client: rahul._id,
      title: 'Design a simple onboarding flow for a learning app',
      description:
        'Our exam-prep app loses users in the first five minutes. We need a friendly onboarding flow of 4 to 6 screens that asks for the exam, target date and daily study time. Deliver Figma screens and a clickable prototype.',
      category: 'Design',
      skills: ['Figma', 'UI Design', 'Prototyping'],
      budget: 18000,
      deadline: daysFromNow(18),
    },
    {
      client: rahul._id,
      title: 'Write 5 SEO blog posts on exam preparation',
      description:
        'Need five original blog posts of about 1,200 words each on topics like making a JEE study plan and handling exam stress. Each post needs a keyword-focused title, meta description and clear subheadings.',
      category: 'Writing',
      skills: ['SEO', 'Blog Writing'],
      budget: 8000,
      deadline: daysFromNow(10),
    },
    {
      client: rahul._id,
      title: 'Build a dashboard to analyse student quiz results',
      description:
        'We export quiz results as CSV files every week. We want a small dashboard that shows average scores by topic, weak areas per student and progress over time. Python with Streamlit or a simple web dashboard is fine.',
      category: 'Data & AI',
      skills: ['Python', 'Pandas', 'Data Visualisation'],
      budget: 30000,
      deadline: daysFromNow(30),
    },
  ]);

  // ---- 3 pending bids (bidsCount kept in sync) ----
  await Bid.create([
    {
      gig: landingPage._id,
      freelancer: aman._id,
      amount: 22000,
      deliveryDays: 12,
      proposal:
        'I have read your brief and the landing page sounds like a great fit. I will build it in React with mobile-first CSS, match your Figma designs closely and keep the page fast. Could you share the Figma link?',
    },
    {
      gig: onboardingFlow._id,
      freelancer: neha._id,
      amount: 16500,
      deliveryDays: 10,
      proposal:
        'Losing users in the first five minutes usually means onboarding asks too much too soon. I will map the flow, design 5 friendly screens in Figma and link them into a clickable prototype. Which exams do most users pick?',
    },
    {
      gig: blogPosts._id,
      freelancer: karan._id,
      amount: 7500,
      deliveryDays: 7,
      proposal:
        'I write about education and exam preparation regularly. For each post I will research keywords, write an outline for your approval and then deliver a clear, original article with a meta description. Do you have a list of keywords?',
    },
  ]);
  await Gig.updateMany({ _id: { $in: [landingPage._id, onboardingFlow._id, blogPosts._id] } }, { bidsCount: 1 });

  // ---- 1 completed gig: accepted bid, chat history and reviews both ways ----
  const brandKit = await Gig.create({
    client: priya._id,
    title: 'Logo and brand kit for a skincare startup',
    description:
      'We need a modern logo, colour palette and typography guide for Glow & Co. The brand should feel fresh, honest and gentle. Final files in SVG and PNG, plus a one-page brand guide.',
    category: 'Design',
    skills: ['Branding', 'Illustrator', 'Logo Design'],
    budget: 15000,
    bidsCount: 1,
  });
  const acceptedBid = await Bid.create({
    gig: brandKit._id,
    freelancer: neha._id,
    amount: 14000,
    deliveryDays: 8,
    proposal:
      'A skincare brand needs to look calm and trustworthy. I will start with a moodboard, share three logo directions, refine your favourite and deliver a simple brand guide with colours and fonts. What feeling should customers get first?',
    status: 'accepted',
  });
  brandKit.status = 'completed';
  brandKit.assignedFreelancer = neha._id;
  brandKit.acceptedBid = acceptedBid._id;
  await brandKit.save();

  const conversation = await Conversation.create({ participants: [priya._id, neha._id], gig: brandKit._id });
  const chat = [
    [priya, 'Hi Neha, welcome aboard! Excited to see the first logo directions.', 300],
    [neha, 'Thank you, Priya! I will share the moodboard and three directions by Thursday.', 290],
    [neha, 'The final files and the brand guide are uploaded. Let me know if anything needs a change.', 60],
    [priya, 'They look beautiful. Marking the gig as complete now. Thanks a lot!', 45],
  ];
  const messages = await Message.insertMany(
    chat.map(([sender, text, ago]) => ({
      conversation: conversation._id,
      sender: sender._id,
      text,
      readBy: [priya._id, neha._id],
      createdAt: minutesAgo(ago),
      updatedAt: minutesAgo(ago),
    }))
  );
  const last = messages[messages.length - 1];
  conversation.lastMessage = { text: last.text, sender: last.sender, createdAt: last.createdAt };
  await conversation.save();

  // Review.create runs the post-save hook that recalculates each user's rating
  await Review.create({
    gig: brandKit._id,
    reviewer: priya._id,
    reviewee: neha._id,
    rating: 5,
    comment: 'Neha understood our brand quickly and delivered ahead of time. The brand guide is very clear.',
  });
  await Review.create({
    gig: brandKit._id,
    reviewer: neha._id,
    reviewee: priya._id,
    rating: 5,
    comment: 'Clear brief, quick feedback and on-time payment. Would happily work with Priya again.',
  });

  // ---- Follows (both sides of the relationship) ----
  const follow = async (follower, followed) => {
    await User.updateOne({ _id: follower._id }, { $addToSet: { following: followed._id } });
    await User.updateOne({ _id: followed._id }, { $addToSet: { followers: follower._id } });
  };
  await follow(aman, priya);
  await follow(priya, neha);
  await follow(karan, rahul);

  // ---- A few notifications so the bell is not empty ----
  await Notification.insertMany([
    { user: priya._id, from: aman._id, type: 'bid', message: `Aman bid ₹22,000 on "${landingPage.title}"`, link: `/gigs/${landingPage._id}` },
    { user: priya._id, from: aman._id, type: 'follow', message: 'Aman started following you', link: `/users/${aman._id}` },
    { user: rahul._id, from: neha._id, type: 'bid', message: `Neha bid ₹16,500 on "${onboardingFlow.title}"`, link: `/gigs/${onboardingFlow._id}` },
    { user: rahul._id, from: karan._id, type: 'bid', message: `Karan bid ₹7,500 on "${blogPosts.title}"`, link: `/gigs/${blogPosts._id}` },
    { user: neha._id, from: priya._id, type: 'gig-completed', message: `"${brandKit.title}" was marked complete. Leave a review`, link: `/gigs/${brandKit._id}`, read: true },
    { user: neha._id, from: priya._id, type: 'review', message: 'Priya left you a 5-star review', link: `/users/${neha._id}` },
  ].map((notification, i) => ({ ...notification, createdAt: minutesAgo(40 - i * 5) }))); // newest last

  console.log('Created 6 users, 6 gigs (5 open + 1 completed), 4 bids, 2 reviews, 1 conversation.');
  console.log('\nDemo logins');
  console.log('  Admin       admin@hirely.dev     / admin123');
  console.log('  Client      priya@client.dev     / password123');
  console.log('  Client      rahul@client.dev     / password123');
  console.log('  Freelancer  aman@freelancer.dev  / password123');
  console.log('  Freelancer  neha@freelancer.dev  / password123');
  console.log('  Freelancer  karan@freelancer.dev / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error('Seeding failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});

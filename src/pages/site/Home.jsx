import React from 'react';
import Navbar from '../../components/site/Navbar';
import Hero from '../../components/site/Hero';
import Courses from '../../components/site/Courses';
import Stats from '../../components/site/Stats';
import Cta from '../../components/site/Cta';
import Footer from '../../components/site/Footer';
import Testimonials from '../../components/site/Testimonials';
import ReviewNotifier from '../../components/site/ReviewNotifier';
import WhatsAppButton from '../../components/site/WhatsAppButton';
const Home = () => {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <Stats />
      <Courses />
      <Cta />
      <Testimonials />
      <Footer />
      <WhatsAppButton />
      <ReviewNotifier />
    </div>
  );
};

export default Home;

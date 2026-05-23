'use client';

import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import Image from 'next/image';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

const aboutSlides = [
  { src: '/images/opai-img-162.jpg' },
  { src: '/images/opai-img-163.jpg' },
  { src: '/images/opai-img-164.jpg' },
  { src: '/images/opai-img-165.jpg' },
  { src: '/images/opai-img-166.jpg' },
  { src: '/images/opai-img-167.jpg' },
  { src: '/images/opai-img-168.jpg' },
];
const AboutSwiper = () => {
  return (
    <RevealAnimation delay={0.4}>
      <div>
        <Swiper
          className="overflow-hidden!"
          modules={[Autoplay]}
          initialSlide={3}
          centeredSlides
          spaceBetween={0}
          speed={1400}
          loop
          allowTouchMove
          autoplay={{
            delay: 2000,
            disableOnInteraction: true,
          }}
          breakpoints={{
            480: {
              slidesPerView: 1,
              spaceBetween: 0,
              centeredSlides: true,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 0,
            },
          }}
          onInit={(swiper: SwiperClass) => {
            const transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            swiper.slides.forEach((slide) => {
              slide.style.transition = transition;
              slide.style.transform = 'scale(0.8)';
              slide.style.opacity = '0.3';
              slide.style.filter = 'blur(3px)';
            });
            const activeSlide = swiper.slides[swiper.activeIndex];
            if (activeSlide) {
              activeSlide.style.transform = 'scale(1)';
              activeSlide.style.opacity = '1';
              activeSlide.style.filter = 'blur(0)';
            }
          }}
          onSlideChange={(swiper: SwiperClass) => {
            swiper.slides.forEach((slide) => {
              slide.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              slide.style.transform = 'scale(0.8)';
              slide.style.opacity = '0.3';
              slide.style.filter = 'blur(3px)';
            });
          }}
          onSlideChangeTransitionStart={(swiper: SwiperClass) => {
            const activeSlide = swiper.slides[swiper.activeIndex];
            if (activeSlide) {
              activeSlide.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              activeSlide.style.transform = 'scale(1)';
              activeSlide.style.opacity = '1';
              activeSlide.style.filter = 'blur(0)';
            }
          }}
        >
          {aboutSlides.map((slide) => (
            <SwiperSlide key={slide.src}>
              <figure className="h-[400px] max-w-[480px] overflow-hidden rounded-lg md:h-[500px] lg:h-[650px]">
                <Image
                  src={slide.src}
                  alt="about"
                  width={480}
                  height={650}
                  className="size-full object-cover"
                />
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </RevealAnimation>
  );
};

export default AboutSwiper;

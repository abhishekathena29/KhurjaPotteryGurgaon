import { Star, Quote } from 'lucide-react'

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      location: 'Gurgaon',
      rating: 5,
      text: 'Amazing collection of pottery! The traditional designs are stunning. Great service and fast delivery. I\'ve ordered multiple times and always been satisfied.',
      product: 'Traditional Ceramic Vase',
    },
    {
      name: 'Priya Sharma',
      location: 'Delhi',
      rating: 5,
      text: 'Beautiful handcrafted mugs! The quality is exceptional and they arrived safely. Will definitely order again. Love supporting local artisans!',
      product: 'Terracotta Mug Set',
    },
    {
      name: 'Anita Mehta',
      location: 'Noida',
      rating: 5,
      text: 'Love my new planter! It\'s perfect for my balcony garden. The craftsmanship is outstanding. Each piece feels unique and special.',
      product: 'Decorative Ceramic Planter',
    },
    {
      name: 'Vikram Singh',
      location: 'Faridabad',
      rating: 5,
      text: 'Ordered a dinner set for my family. The plates are beautiful and durable. Great value for money. Highly recommend!',
      product: 'Traditional Dinner Plate Set',
    },
    {
      name: 'Sunita Patel',
      location: 'Gurgaon',
      rating: 5,
      text: 'The custom design service is fantastic! They created exactly what I wanted. The artisans are so talented. Will order custom pieces again.',
      product: 'Custom Ceramic Bowl',
    },
    {
      name: 'Amit Verma',
      location: 'Delhi',
      rating: 5,
      text: 'Excellent quality and beautiful designs. Fast delivery and great packaging. Every piece tells a story. Proud to support local crafts!',
      product: 'Handcrafted Tea Set',
    },
  ]

  return (
    <section className="bg-white border border-sand rounded-xl p-8 md:p-12 mb-12 max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-display font-medium mb-12 text-brown-dark tracking-tight text-center">
        What Our Community Says
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map((testimonial, idx) => (
          <div
            key={idx}
            className="bg-sand/30 border border-sand rounded-xl p-8 relative flex flex-col"
          >
            <Quote className="text-brown-light/20 absolute top-6 right-6" size={32} />
            <div className="flex items-center gap-1 mb-6">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className="text-terracotta fill-terracotta"
                />
              ))}
            </div>
            <p className="text-brown-dark font-light leading-relaxed mb-8 relative z-10 flex-1 text-sm md:text-base">
              "{testimonial.text}"
            </p>
            <div className="border-t border-sand pt-6 mt-auto">
              <p className="font-medium text-brown-dark text-sm tracking-wide">
                {testimonial.name}
              </p>
              <p className="text-xs text-brown-light font-light mt-1">{testimonial.location}</p>
              <p className="text-[10px] uppercase tracking-widest text-terracotta mt-3 font-medium">{testimonial.product}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TestimonialsSection


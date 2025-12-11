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
    <section className="bg-cream rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-6 text-brown-dark text-center">
        What Our Customers Say
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-md p-6 relative"
          >
            <Quote className="text-purple/20 absolute top-4 right-4" size={40} />
            <div className="flex items-center gap-1 mb-3">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className="text-yellow-400 fill-current"
                />
              ))}
            </div>
            <p className="text-brown-dark/80 mb-4 italic relative z-10">
              "{testimonial.text}"
            </p>
            <div className="border-t border-brown-light pt-4">
              <p className="font-semibold text-brown-dark">
                - {testimonial.name}
              </p>
              <p className="text-sm text-brown-dark/60">{testimonial.location}</p>
              <p className="text-xs text-purple mt-1">{testimonial.product}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TestimonialsSection


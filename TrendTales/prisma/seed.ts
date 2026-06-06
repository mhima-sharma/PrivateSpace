import { PrismaClient, Platform, BlogStatus, type Category } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

function slug(input: string) {
  return slugify(input, { lower: true, strict: true });
}

function readingTime(html: string) {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

const CATEGORIES = [
  { name: "Fashion", description: "The latest styles, trends, and wardrobe inspiration.", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800" },
  { name: "Travel", description: "Destinations, guides, and unforgettable journeys.", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800" },
  { name: "Technology", description: "Gadgets, reviews, and the future of tech.", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800" },
  { name: "Lifestyle", description: "Living well, every single day.", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800" },
  { name: "Food", description: "Recipes, restaurants, and culinary adventures.", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800" },
  { name: "Deals", description: "Hand-picked deals you don't want to miss.", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800" },
];

async function main() {
  console.log("🌱 Seeding TrendTales...");

  // ── Admin user ──
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@trendtales.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: process.env.SEED_ADMIN_NAME ?? "TrendTales Admin",
      role: "ADMIN",
    },
  });
  console.log(`✓ Admin: ${admin.email}`);

  // ── Categories ──
  const categories: Category[] = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const category = await prisma.category.upsert({
      where: { slug: slug(c.name) },
      update: { description: c.description, image: c.image },
      create: { name: c.name, slug: slug(c.name), description: c.description, image: c.image, order: i },
    });
    categories.push(category);
  }
  console.log(`✓ ${categories.length} categories`);

  const byName = (name: string) => categories.find((c) => c.name === name)!;

  // ── Travel destinations ──
  const destinations = [
    { name: "Bali, Indonesia", location: "Indonesia", description: "Island of the Gods — beaches, temples and rice terraces.", bestTimeToVisit: "April to October", budget: "₹60,000 – ₹1,20,000", travelTips: "Rent a scooter, respect temple dress codes, carry cash.", cover: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200", mapUrl: "https://www.google.com/maps?q=Bali&output=embed" },
    { name: "Santorini, Greece", location: "Greece", description: "Whitewashed cliffs and the most famous sunset in the world.", bestTimeToVisit: "May to September", budget: "₹1,20,000 – ₹2,50,000", travelTips: "Book Oia sunset spots early, wear comfortable shoes.", cover: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200", mapUrl: "https://www.google.com/maps?q=Santorini&output=embed" },
    { name: "Manali, India", location: "Himachal Pradesh, India", description: "Snowy peaks, pine forests and adventure in the Himalayas.", bestTimeToVisit: "October to February (snow), March to June (pleasant)", budget: "₹15,000 – ₹35,000", travelTips: "Carry layers, book cabs in advance during peak season.", cover: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200", mapUrl: "https://www.google.com/maps?q=Manali&output=embed" },
  ];
  const createdDestinations = [];
  for (const d of destinations) {
    const dest = await prisma.travelDestination.upsert({
      where: { slug: slug(d.name) },
      update: {},
      create: {
        name: d.name,
        slug: slug(d.name),
        location: d.location,
        description: d.description,
        bestTimeToVisit: d.bestTimeToVisit,
        budget: d.budget,
        travelTips: d.travelTips,
        coverImage: d.cover,
        mapUrl: d.mapUrl,
        isFeatured: true,
        gallery: [d.cover],
      },
    });
    createdDestinations.push(dest);
  }
  console.log(`✓ ${createdDestinations.length} destinations`);

  // ── Blogs ──
  const blogs = [
    {
      title: "10 Must-Have Wardrobe Staples for 2026",
      category: "Fashion",
      excerpt: "Build a timeless capsule wardrobe with these versatile essentials.",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
      featured: true,
      content: "<h2>Build a capsule wardrobe</h2><p>A great wardrobe starts with versatile staples that mix and match effortlessly. Here are ten pieces every closet needs.</p><ul><li>A crisp white shirt</li><li>Well-fitted denim</li><li>A tailored blazer</li></ul><p>Invest in quality over quantity and your style will always look intentional.</p>",
    },
    {
      title: "A Complete Travel Guide to Bali",
      category: "Travel",
      destination: "Bali, Indonesia",
      excerpt: "Everything you need to plan the perfect Bali getaway.",
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200",
      featured: true,
      content: "<h2>Welcome to the Island of the Gods</h2><p>Bali offers something for everyone — from serene rice terraces to vibrant nightlife.</p><h3>Getting around</h3><p>Renting a scooter is the cheapest and most flexible way to explore.</p>",
    },
    {
      title: "The Best Budget Smartphones of 2026",
      category: "Technology",
      excerpt: "Flagship features without the flagship price tag.",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200",
      trending: true,
      content: "<h2>Great phones, smaller price</h2><p>You no longer need to spend a fortune for a fantastic phone. These models punch well above their weight.</p>",
    },
    {
      title: "5 Morning Habits That Changed My Life",
      category: "Lifestyle",
      excerpt: "Small routines that compound into big results.",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200",
      content: "<h2>Win the morning</h2><p>How you start your day shapes everything that follows. Here are five habits worth building.</p>",
    },
    {
      title: "Easy 30-Minute Weeknight Dinners",
      category: "Food",
      excerpt: "Delicious meals on the table fast.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
      trending: true,
      content: "<h2>Dinner, sorted</h2><p>These quick recipes prove that fast food can also be wholesome and tasty.</p>",
    },
    {
      title: "Top Tech Deals You Shouldn't Miss This Week",
      category: "Deals",
      excerpt: "The best discounts on gadgets, hand-picked for you.",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200",
      featured: true,
      content: "<h2>This week's best deals</h2><p>We've rounded up the discounts actually worth your money.</p>",
    },
  ];

  const createdBlogs = [];
  for (const b of blogs) {
    const blog = await prisma.blog.upsert({
      where: { slug: slug(b.title) },
      update: {},
      create: {
        title: b.title,
        slug: slug(b.title),
        excerpt: b.excerpt,
        content: b.content,
        featuredImage: b.image,
        categoryId: byName(b.category).id,
        authorId: admin.id,
        destinationId: b.destination ? createdDestinations.find((d) => d.name === b.destination)?.id : undefined,
        tags: [b.category.toLowerCase(), "trendtales"],
        status: BlogStatus.PUBLISHED,
        isFeatured: b.featured ?? false,
        isTrending: b.trending ?? false,
        readingTime: readingTime(b.content),
        views: Math.floor(Math.random() * 500) + 20,
        publishedAt: new Date(),
      },
    });
    createdBlogs.push(blog);
  }
  console.log(`✓ ${createdBlogs.length} blogs`);

  // ── Products ──
  const fashionBlog = createdBlogs.find((b) => b.title.includes("Wardrobe"));
  const dealsBlog = createdBlogs.find((b) => b.title.includes("Tech Deals"));
  const products = [
    { name: "Classic White Cotton Shirt", description: "Breathable everyday essential.", price: 1299, platform: Platform.MYNTRA, url: "https://www.myntra.com", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600", blogId: fashionBlog?.id, featured: true },
    { name: "Slim-Fit Stretch Jeans", description: "All-day comfort denim.", price: 1999, platform: Platform.AJIO, url: "https://www.ajio.com", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", blogId: fashionBlog?.id },
    { name: "Wireless Noise-Cancelling Headphones", description: "Immersive sound, 30h battery.", price: 4999, platform: Platform.AMAZON, url: "https://www.amazon.in", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", blogId: dealsBlog?.id, featured: true },
    { name: "Smart Fitness Band", description: "Track steps, sleep and heart rate.", price: 2499, platform: Platform.FLIPKART, url: "https://www.flipkart.com", image: "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=600", blogId: dealsBlog?.id, featured: true },
  ];
  let productCount = 0;
  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        platform: p.platform,
        affiliateUrl: p.url,
        image: p.image,
        blogId: p.blogId,
        isFeatured: p.featured ?? false,
        clicks: Math.floor(Math.random() * 200),
      },
    });
    productCount++;
  }
  console.log(`✓ ${productCount} products`);

  // ── Newsletter subscribers ──
  await prisma.newsletterSubscriber.upsert({
    where: { email: "subscriber@example.com" },
    update: {},
    create: { email: "subscriber@example.com" },
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

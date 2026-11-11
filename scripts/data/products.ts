import type { Product } from "../../src/catalogue/product";

// The catalogue as code: the source of truth for `products/{id}` in
// Firestore. Edit here, then run `npm run seed:products` (see the script for
// a dry run first). IDs, names, prices and images match the original
// `collections` documents so existing carts and orders keep working.

const img = (path: string) => `https://i.ibb.co/${path}`;

export const products: Product[] = [
  // Hats
  {
    id: 1,
    name: "Brown Brim",
    category: "hats",
    price: 25,
    imageUrl: img("ZYW3VTp/brown-brim.png"),
    description:
      "A wide-brimmed hat in warm brown that adds shade and a little polish to any outfit. It pairs as easily with a summer shirt as with a winter coat.",
  },
  {
    id: 2,
    name: "Blue Beanie",
    category: "hats",
    price: 18,
    imageUrl: img("ypkgK0X/blue-beanie.png"),
    description:
      "A snug knit beanie in bright blue. Easy to pull on for cold mornings and weekend walks.",
  },
  {
    id: 3,
    name: "Brown Cowboy",
    category: "hats",
    price: 35,
    imageUrl: img("QdJwgmp/brown-cowboy.png"),
    description:
      "A classic cowboy shape with a curved brim, in rich brown. Made for festivals, road trips and anyone who likes a hat with character.",
  },
  {
    id: 4,
    name: "Grey Brim",
    category: "hats",
    price: 25,
    imageUrl: img("RjBLWxB/grey-brim.png"),
    description:
      "The same easy wide brim as our brown version, in a soft grey that goes with everything. A quiet finishing touch for neutral outfits.",
  },
  {
    id: 5,
    name: "Green Beanie",
    category: "hats",
    price: 18,
    imageUrl: img("YTjW3vF/green-beanie.png"),
    description:
      "A cosy knit beanie in green. Wear the cuff folded up for a closer fit or down for extra warmth.",
  },
  {
    id: 6,
    name: "Palm Tree Cap",
    category: "hats",
    price: 14,
    imageUrl: img("rKBDvJX/palm-tree-cap.png"),
    description:
      "A relaxed cap with a palm tree print, made for sunny days and holidays. It brings a bit of summer to a plain tee.",
  },
  {
    id: 7,
    name: "Red Beanie",
    category: "hats",
    price: 18,
    imageUrl: img("bLB646Z/red-beanie.png"),
    description:
      "A knit beanie in bold red that's easy to spot on a grey day. Warm, simple and good with any coat.",
  },
  {
    id: 8,
    name: "Wolf Cap",
    category: "hats",
    price: 14,
    imageUrl: img("1f2nWMM/wolf-cap.png"),
    description:
      "A cap with a wolf graphic on the front. A small statement piece for everyday outfits.",
  },
  {
    id: 9,
    name: "Blue Snapback",
    category: "hats",
    price: 16,
    imageUrl: img("X2VJP2W/blue-snapback.png"),
    description:
      "A flat-brim snapback in blue with a structured front. A streetwear staple that sits well with hoodies and sneakers.",
  },

  // Sneakers
  {
    id: 10,
    name: "Adidas NMD",
    category: "sneakers",
    price: 220,
    imageUrl: img("0s3pdnc/adidas-nmd.png"),
    description:
      "A sleek, modern runner made for all-day wear around town. Light enough for travel days and smart enough for evenings out.",
  },
  {
    id: 11,
    name: "Adidas Yeezy",
    category: "sneakers",
    price: 280,
    imageUrl: img("dJbG1cT/yeezy.png"),
    description:
      "A sought-after sneaker with a distinctive, streamlined shape. A statement pair for collectors and everyday wear alike.",
  },
  {
    id: 12,
    name: "Black Converse",
    category: "sneakers",
    price: 110,
    imageUrl: img("bPmVXyP/black-converse.png"),
    description:
      "The classic canvas high-top in black. Goes with jeans, shorts and everything in between.",
  },
  {
    id: 13,
    name: "Nike White AirForce",
    category: "sneakers",
    price: 160,
    imageUrl: img("1RcFPk0/white-nike-high-tops.png"),
    description:
      "A clean, all-white classic with a timeless basketball look. Works with almost any outfit, from jeans to tailoring.",
  },
  {
    id: 14,
    name: "Nike Red High Tops",
    category: "sneakers",
    price: 160,
    imageUrl: img("QcvzydB/nikes-red.png"),
    description:
      "High-top sneakers in a bold red that make the outfit. Pair them with dark denim to let the colour stand out.",
  },
  {
    id: 15,
    name: "Nike Brown High Tops",
    category: "sneakers",
    price: 160,
    imageUrl: img("fMTV342/nike-brown.png"),
    description:
      "High-top sneakers in earthy brown, a warmer take on the classic. Easy to wear through autumn and winter.",
  },
  {
    id: 16,
    name: "Air Jordan Limited",
    category: "sneakers",
    price: 190,
    imageUrl: img("w4k6Ws9/nike-funky.png"),
    description:
      "A limited-run high-top with a bold, colourful design. Made for collectors and anyone who wants their sneakers noticed.",
  },
  {
    id: 17,
    name: "Timberlands",
    category: "sneakers",
    price: 200,
    imageUrl: img("Mhh6wBg/timberlands.png"),
    description:
      "Rugged lace-up boots with a chunky sole. Ready for wet streets, muddy paths and cold days.",
  },

  // Jackets
  {
    id: 18,
    name: "Black Jean Shearling",
    category: "jackets",
    price: 125,
    imageUrl: img("XzcwL5s/black-shearling.png"),
    description:
      "A black denim jacket with a warm shearling-style collar and lining. A tougher take on a classic for colder months.",
  },
  {
    id: 19,
    name: "Blue Jean Jacket",
    category: "jackets",
    price: 90,
    imageUrl: img("mJS6vz0/blue-jean-jacket.png"),
    description:
      "The classic blue denim jacket that goes with almost everything. Layer it over a tee in spring or a hoodie in autumn.",
  },
  {
    id: 20,
    name: "Grey Jean Jacket",
    category: "jackets",
    price: 90,
    imageUrl: img("N71k1ML/grey-jean-jacket.png"),
    description:
      "A denim jacket in washed grey, a softer alternative to classic blue. Easy to layer over light and dark colours.",
  },
  {
    id: 21,
    name: "Brown Shearling",
    category: "jackets",
    price: 165,
    imageUrl: img("s96FpdP/brown-shearling.png"),
    description:
      "A brown jacket with a cosy shearling-style finish, made for cold days. Smart enough for the city and warm enough for the weekend.",
  },
  {
    id: 22,
    name: "Tan Trench",
    category: "jackets",
    price: 185,
    imageUrl: img("M6hHc3F/brown-trench.png"),
    description:
      "A long trench coat in classic tan. Belt it for a sharp shape or wear it open over knitwear.",
  },

  // Womens
  {
    id: 23,
    name: "Blue Tanktop",
    category: "womens",
    price: 25,
    imageUrl: img("7CQVJNm/blue-tank.png"),
    description:
      "A simple tank top in blue for warm days. Wear it on its own or under an open shirt.",
  },
  {
    id: 24,
    name: "Floral Blouse",
    category: "womens",
    price: 20,
    imageUrl: img("4W2DGKm/floral-blouse.png"),
    description:
      "A light blouse with a floral print that brightens any outfit. Tuck it into jeans or wear it loose over a skirt.",
  },
  {
    id: 25,
    name: "Floral Dress",
    category: "womens",
    price: 80,
    imageUrl: img("KV18Ysr/floral-skirt.png"),
    description:
      "A floral piece for summer days and evenings out. Dress it up with heels or keep it easy with sneakers.",
  },
  {
    id: 26,
    name: "Red Dots Dress",
    category: "womens",
    price: 80,
    imageUrl: img("N3BN1bh/red-polka-dot-dress.png"),
    description:
      "A red polka dot dress with a playful, retro feel. Great for parties, dinners and summer weddings.",
  },
  {
    id: 27,
    name: "Striped Sweater",
    category: "womens",
    price: 45,
    imageUrl: img("KmSkMbH/striped-sweater.png"),
    description:
      "A striped sweater for relaxed, layered looks. Pairs well with jeans or a skirt on cooler days.",
  },
  {
    id: 28,
    name: "Yellow Track Suit",
    category: "womens",
    price: 135,
    imageUrl: img("v1cvwNf/yellow-track-suit.png"),
    description:
      "A matching track suit in bright yellow. Wear the set for a bold look, or split the pieces up.",
  },
  {
    id: 29,
    name: "White Blouse",
    category: "womens",
    price: 20,
    imageUrl: img("qBcrsJg/white-vest.png"),
    description:
      "A clean white top that works for the office and the weekend. An easy base for jackets and statement accessories.",
  },

  // Mens
  {
    id: 30,
    name: "Camo Down Vest",
    category: "mens",
    price: 325,
    imageUrl: img("xJS0T3Y/camo-vest.png"),
    description:
      "A padded vest with a camo print that keeps your core warm without bulky sleeves. Layer it over a hoodie or a shirt.",
  },
  {
    id: 31,
    name: "Floral T-shirt",
    category: "mens",
    price: 20,
    imageUrl: img("qMQ75QZ/floral-shirt.png"),
    description:
      "A floral print top for holidays and summer evenings. Pairs well with chinos or shorts.",
  },
  {
    id: 32,
    name: "Black & White Longsleeve",
    category: "mens",
    price: 25,
    imageUrl: img("55z32tw/long-sleeve.png"),
    description:
      "A long-sleeve top in black and white for an easy, graphic look. Works on its own or under a jacket.",
  },
  {
    id: 33,
    name: "Pink T-shirt",
    category: "mens",
    price: 25,
    imageUrl: img("RvwnBL8/pink-shirt.png"),
    description:
      "A simple top in pink, a fresh change from the usual neutrals. Easy to wear with denim or shorts.",
  },
  {
    id: 34,
    name: "Jean Long Sleeve",
    category: "mens",
    price: 40,
    imageUrl: img("VpW4x5t/roll-up-jean-shirt.png"),
    description:
      "A long-sleeve denim shirt to wear buttoned up or open as a light layer. Roll up the sleeves for a relaxed look.",
  },
  {
    id: 35,
    name: "Burgundy T-shirt",
    category: "mens",
    price: 25,
    imageUrl: img("mh3VM1f/polka-dot-shirt.png"),
    description:
      "A top in deep burgundy that adds colour without shouting. Pairs well with dark jeans and white sneakers.",
  },
];

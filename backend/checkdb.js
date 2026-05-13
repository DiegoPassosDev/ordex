const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const env = fs.readFileSync('.env','utf-8').split(/\r?\n/).filter(Boolean).reduce((acc,line)=>{const [k,v]=line.split('=');acc[k]=v.replace(/^"|"$/g,'');return acc;},{});
process.env.DATABASE_URL = env.DATABASE_URL;
const prisma = new PrismaClient();
(async()=>{
  try {
    const restaurants = await prisma.restaurant.findMany({select:{id:true,name:true}, take:10});
    const employees = await prisma.employee.findMany({select:{id:true,name:true,email:true,role:true,restaurantId:true}, take:10});
    console.log('restaurants', restaurants);
    console.log('employees', employees);
  } catch(e){ console.error('ERROR', e.message); process.exit(1);} finally { await prisma.$disconnect(); }
})();

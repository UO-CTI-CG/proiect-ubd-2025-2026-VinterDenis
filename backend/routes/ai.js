const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const transactionService = require("../services/transactionService");

const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

router.get("/financial-report", async (req, res) => {
  console.log("--- 🤖 Procesare SmartAdvisor: Început ---");

  try {
    const monthIndex = req.query.month ? parseInt(req.query.month) : new Date().getMonth();
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const monthNames = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
    const monthName = monthNames[monthIndex];

    const start = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const end = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${lastDay}`;

    console.log(`📊 Colectare date MySQL pentru ${monthName}...`);
    const income = await transactionService.getIncomeByPeriod(start, end) || 0;
    const expense = await transactionService.getExpenseByPeriod(start, end) || 0;
    const balance = await transactionService.getSoldByPeriod(start, end) || 0;
    const topCatData = await transactionService.getTopCategories(1);
    const topCategory = topCatData && topCatData.length > 0 ? topCatData[0].category_name : "generale";
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

    const prompt = `
      Ești MyBudget AI, consultant financiar. Date utilizator:(${monthName} ${year}):
      - Venit: ${income} RON
      - Cheltuieli: ${expense} RON
      - Sold: ${balance} RON
      - Rata economisire: ${savingsRate}%
      - Top consum: ${topCategory}
      Generează un raport financiar scurt.

Reguli:
- maxim 3 propoziții per paragraf
- maxim 110-130 cuvinte total
- răspuns clar și concis
- fără introduceri inutile

Structură:

Analiză:
...

Sfat Categorie:
...

Strategie Economisire:
...

Răspunde doar în română.
    `;

    let aiText = null;
    let modelError = null;
    // Modelele care FUNCȚIONEAZĂ - gemini-2.0-flash și lite sunt disponibile
    const modelCandidates = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite"
    ];

    for (const modelName of modelCandidates) {
      try {
        console.log(`🧠 Încercare model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text) {
          aiText = text;
          console.log(`✅ SUCCES cu modelul: ${modelName}`);
          break;
        }
      } catch (err) {
        modelError = err;
        console.warn(`⚠️ Modelul ${modelName} a eșuat:`, err.message);
      }
    }

    if (!aiText) {
      console.error("❗ Nu s-a putut obține răspuns AI de la niciun model.", modelError?.message);
      throw modelError || new Error("A apărut o eroare necunoscută la apelul modelului AI.");
    }

    console.log("✅ SUCCES: Raport generat!");
    res.json({ text: aiText });

  } catch (error) {
    console.error("❌ EROARE CRITICĂ AI BACKEND:");
    console.error("Mesaj:", error.message);

    let errorMessage = "Asistentul AI este momentan indisponibil.";

    if (error.message.includes("404")) {
      errorMessage = "Eroare: Modelul Gemini nu a fost găsit. Verifică setările API.";
    } else if (error.message.includes("429")) {
      errorMessage = "Limita API depășită. Încearcă din nou în câteva minute.";
    } else if (error.message.includes("fetch failed")) {
      errorMessage = "Eroare de conexiune la serverele Google (DNS).";
    }

    res.status(500).json({
      text: errorMessage,
      debug: error.message
    });
  }
});

module.exports = router;
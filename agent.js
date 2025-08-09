import Groq from "groq-sdk";
import readline from "node:readline/promises";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let dbExpense = [];

async function agent() {
  let messages = [
    {
      role: "system",
      content: `You are a personal finance assistant. 
You have access to the following functions:
1. getTotalExpense(from, to) => returns total expense in a date range.
2. addExpense(name, amount) => adds a new expense entry.
3. addMoney(name, amount) => add a money entry 

Always call the function when the user asks for these actions, instead of responding directly.
Today's date: ${new Date().toISOString()}.`,
    },
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while (true) {
    const message = await rl.question("User: ");

    if (message === "bye") {
      rl.close();
      break;
    }
    messages.push({ role: "user", content: message });

    while (true) {
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile",
        tool_choice: "auto",
        tools: [
          {
            type: "function",
            function: {
              name: "getToatalExpense",
              description: "Returns the total expense between two dates",
              parameters: {
                type: "object",
                properties: {
                  from: {
                    type: "string",
                    description: "The start date",
                  },
                  to: {
                    type: "string",
                    description: "The end date",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addExpense",
              description: "add a new expense entry to the databases",
              parameters: {
                type: "object",
                properties: {
                  amount: {
                    type: "number",
                    description: "The amount of the expense",
                  },
                  name: {
                    type: "string",
                    description: "The description of the expense",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addMoney",
              description: "add a new money entry to the databases",
              parameters: {
                type: "object",
                properties: {
                  amount: {
                    type: "number",
                    description: "The amount of the money",
                  },
                  name: {
                    type: "string",
                    description: "The description of the money",
                  },
                },
              },
            },
          },
        ],
      });
      // console.log(JSON.stringify(completion.choices[0], null, 2));

      const toolCalls = completion.choices[0].message.tool_calls;
      messages.push(completion.choices[0].message);

      if (!toolCalls) {
        console.log(`Assistant: ${completion.choices[0].message.content}`);
        break;
      }
      for (const tools of toolCalls) {
        const functionName = tools.function.name;
        const functionArrguments = tools.function.arguments;

        let result = "";
        if (functionName === "getToatalExpense") {
          result = getToatalExpense(JSON.parse(functionArrguments));
        } else if (functionName === "addExpense") {
          result = addExpense(JSON.parse(functionArrguments));
        } else if (functionName === "addMoney") {
          result = addMoney(JSON.parse(functionArrguments));
        }
        messages.push({
          role: "tool",
          content: result,
          tool_call_id: tools.id,
        });
      }

      //
      // console.log("--------- messages--------");
      // console.log(JSON.stringify(messages, null, 2));
      // console.log("--------- dbExpense--------");
      // console.log(dbExpense);
    }
  }
}

agent();

const getToatalExpense = ({ from, to }) => {
  console.log("calling the getToatalExpense function");
  const totalExpense = dbExpense.reduce((acc, expense) => {
    return acc + expense.amount;
  }, 0);
  return `${totalExpense} INR`;
};

const addExpense = ({ amount, name }) => {
  console.log("calling the addExpense function");
  dbExpense.push({ amount, name });
  return `Expense of ${amount} for "${name}" added successfully.`;
};

const addMoney = ({ amount, name }) => {
  console.log(`calling the add money function`);
  dbExpense.push({ name, amount });
  return `money of ${amount} for ${name} add succesfully`;
};

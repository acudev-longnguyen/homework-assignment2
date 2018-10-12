/*
 * CLI-related tasks
 *
 */

// Dependencies
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
class _events extends events{};
const e = new _events();
const _data = require('./data');
const helpers = require('./helpers');

const cli = {};

cli._availableCommands = () => {
    return [
      'help',
      'man',
      'menu',
      'orders',
      'users',
      'exit'
    ];
  }

cli._processInput = (str) => {
  if (typeof(str) == 'string' && str.trim().length) {
    // Array of command fragments split by the blank space
    const commandFrags = str.split(' ');

    cli._handleCommand(commandFrags);
  }
}

cli._printOutput = (str) => {
  console.log(str);
}

// Return a result string after processing a command
cli._handleCommand = (command) => {
  const commnandList = cli._availableCommands();
  if (commnandList.indexOf(command[0].toLowerCase()) > -1) {
    return e.emit(command[0], command);
  } else {
    return "Command is not recognized.";
  }
}

// Events binding
e.on('help', (command) => {
  cli._processHelp();
});

e.on('man', (command) => {
  cli._processHelp();
});

e.on('menu', (command) => {
  cli._processMenu();
});

e.on('orders', (command) => {
  // read order id
  cli._processOrders(command[1]);
});

e.on('users', (command) => {
  // read user id
  cli._processUsers(command[1]);
});

e.on('exit', (command) => {
  cli._printOutput('Application terminated');
  process.exit(0);
});

cli._processHelp = (command) => {
  const commandList = [
    {'key' : 'exit', 'description' : 'Kill the CLI (and the rest of the application)'},
    {'key' : 'man', 'description' : 'Show this help page'},
    {'key' : 'help', 'description' : 'Alias of the "man" command'},
    {'key' : 'menu', 'description' : 'Show available menu items'},
    {'key' : 'orders', 'description' : 'Print all orders in the past 24 hours.'},
    {'key' : 'orders --{orderid}', 'description' : 'Print specific order details by order ID'},
    {'key' : 'users', 'description' : 'Show all users signed up in the past 24 hours'},
    {'key' : 'users --{email}', 'description' : 'Show details of a specified user by email address'},
  ];

  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  commandList.map( ({key, description}) => {
      let line = `${cli.horizontalSpace(6)}\x1b[33m${key}${cli.horizontalSpace(6)}\x1b[0m`;
      let padding = cli.horizontalSpace(60 - line.length);
      line+= padding + description;
      cli._printOutput(line);
      cli.verticalSpace();
  });

  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();
}

cli._processMenu = async (command) => {
  // Read menu from stored menu file
  const menu = await _data.read('menu', 'menu');

  cli.verticalSpace(2);
  cli.horizontalLine();
  cli.centered('MENU');
  cli.horizontalLine();
  cli.verticalSpace(2);

  menu.map(({id, name, price}) => {
    let line = `${cli.horizontalSpace(3)}${id}${cli.horizontalSpace(6)}${name}`;

    let padding = 60 - line.length;
    for (i = 0; i < padding; i++) {
          line+=' ';
      }
      line+= `\$${price}`;

    cli._printOutput(line);
  });

  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();
}

cli._processOrders = (orderId) => {
  if (orderId == undefined) {
    cli.getPastDayOrders();
  } else {
    cli.getOrderDetails(orderId);
  }
}

cli.getPastDayOrders = async () => {
  cli.verticalSpace(2);
  cli.horizontalLine();
  cli.centered('LATEST ORDERS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  const ordersList = await _data.list('orders');

  const orderPromises = [];

  ordersList.map( orderId => {
    orderPromises.push(_data.read('orders', orderId));
  });

  Promise.all(orderPromises).then( (orderArray) => {
    // filter
    const result = orderArray.filter( order => {
      return order.timeCreated >= Date.now() - (1000 * 60 * 60 * 24);
    })

    // print
    result.map( ({orderId, total, cart, status}) => {
      total = helpers.convertCentToDollar(total);

      let line = `${cli.horizontalSpace(3)}${orderId}${cli.horizontalSpace(6)}\$${total}${cli.horizontalSpace(6)}${status}`;

      cli._printOutput(line);


      cli._printOutput(`${cli.horizontalSpace(5)}Cart:`);

      cart.map( ({id, name, price}) => {
        let line = `${cli.horizontalSpace(6)}${id}${cli.horizontalSpace(6)}${name}`;

        let padding = 40 - line.length;
        for (i = 0; i < padding; i++) {
              line+=' ';
          }
          line+= `\$${price}`;

        cli._printOutput(line);
      });
    });

    cli.verticalSpace(1);
    // End with another horizontal line
    cli.horizontalLine(); 
  });

};

cli.getOrderDetails = async (orderId) => {
  cli.verticalSpace(2);
  cli.horizontalLine();
  cli.centered('ORDER DETAILS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // trim -- off orderId param
  orderId = orderId.replace('--', '');

  const order = await _data.read('orders', orderId);

  if (order) {
    const total = helpers.convertCentToDollar(order.total);

    let line = `${cli.horizontalSpace(3)}${order.orderId}${cli.horizontalSpace(6)}\$${total}${cli.horizontalSpace(6)}${order.status}`;

    cli._printOutput(line);


    cli._printOutput(`${cli.horizontalSpace(5)}Cart:`);

    order.cart.map( ({id, name, price}) => {
      let line = `${cli.horizontalSpace(6)}${id}${cli.horizontalSpace(6)}${name}`;

      let padding = 40 - line.length;
      for (i = 0; i < padding; i++) {
            line+=' ';
        }
        line+= `\$${price}`;

      cli._printOutput(line);
    });  
  }

  cli.verticalSpace(1);
  // End with another horizontal line
  cli.horizontalLine();
};

cli._processUsers = (email) => {
  if (email == undefined) {
    cli.getLatestUsers();
  } else {
    cli.getUserDetails(email);
  }
}

cli.getLatestUsers = async () => {
  cli.verticalSpace(2);
  cli.horizontalLine();
  cli.centered('LATEST USERS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  const userList = await _data.list('users');

  const userPromises = [];

  userList.map( email => {
    userPromises.push(_data.read('users', email));
  });

  Promise.all(userPromises).then( userArray => {
    // filter
    const result = userArray.filter( user => {
      return user.timeCreated >= Date.now() - (1000 * 60 * 60 * 24);
    })

    // print
    result.map( ({firstName, lastName, email, address}) => {
      let line = `${cli.horizontalSpace(3)}${firstName}${cli.horizontalSpace(10 - firstName.length)}${lastName}${cli.horizontalSpace(10 - lastName.length)}${email}${cli.horizontalSpace(30 - email.length)}${address}`;

      cli._printOutput(line);
    });

    cli.verticalSpace(1);
    // End with another horizontal line
    cli.horizontalLine(); 
  });
};

cli.getUserDetails = async (email) => {
  cli.verticalSpace(2);
  cli.horizontalLine();
  cli.centered('USER DETAILS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // trim -- off orderId param
  email = email.replace('--', '');

  const user = await _data.read('users', email);

  if (user) {
    const {firstName, lastName, email, address} = user;

    let line = `${cli.horizontalSpace(3)}${firstName}${cli.horizontalSpace(10 - firstName.length)}${lastName}${cli.horizontalSpace(10 - lastName.length)}${email}${cli.horizontalSpace(30 - email.length)}${address}`;

    cli._printOutput(line);
  }

  cli.verticalSpace(1);
  // End with another horizontal line
  cli.horizontalLine(); 
};

/*
 * Line Format Utils begin
 */
// Create a vertical space
cli.verticalSpace = (lines) => {
  lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
  for (let i = 0; i < lines; i++) {
    cli._printOutput('');
  }
};

// Create line space
cli.horizontalSpace = (numSpaces) => {
  numSpaces = typeof(numSpaces) == 'number' && numSpaces > 0 ? numSpaces : 1;
  
  return ' '.repeat(numSpaces);
};

// Create a horizontal line across the screen
cli.horizontalLine = () => {

  // Get the available screen size
  const width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  let line = '';
  for (let i = 0; i < width; i++) {
      line+='-';
  }
  cli._printOutput(line);
};

// Create centered text on the screen
cli.centered = (str) => {
  str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  const width = process.stdout.columns;

  // Calculate the left padding there should be
  const leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  let line = ' '.repeat(leftPadding);
  
  line+= str;
  cli._printOutput(line);
};

/*
 * Line Format Utils End
 */

cli.init = () => {
  // Send to console, in dark blue
  console.log('\x1b[34m%s\x1b[0m','The CLI is running');

  // Start the interface
  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  });

  // Create an initial prompt
  _interface.prompt();

  // Handle each line of input separately
  _interface.on('line', (str) => {
    // Send to the input processor
    cli._processInput(str);

    // Re-initialize the prompt afterwards
    _interface.prompt();
  });

  // If the user stops the CLI, kill the associated process
  _interface.on('close', () => {
    process.exit(0);
  });
};

// Export the module
module.exports = cli;
const miTitulo= document.querySelector('h1');
miTitulo.textContent = 'INFINITE AFO';

let boton = document.querySelector('#calcular');

boton.addEventListener('click', function(){

    let n1 = parseFloat(document.querySelector('#n1').value);
    let n2 = parseFloat(document.querySelector('#n2').value);
    let operacion = document.querySelector('#operacion').value.trim();

    if (isNaN(n1) || isNaN(n2)) {
        alert('Por favor, ingrese números válidos en ambos campos.');
        return;
    }

    let resultado;

    switch(operacion) {
        case '+':
            resultado = n1 + n2;
            break;
        case '-':
            resultado = n1 - n2;
            break;
        case '*':
            resultado = n1 * n2;
            break;
        case '/':
            if (n2 === 0) {
                alert('Error: División por cero no permitida.');
                return;
            }
            resultado = n1 / n2;
            break;
        default:
            alert('Operación no válida. Por favor, elija sumar, restar, multiplicar o dividir.');
            return;
    }
    alert('El resultado es: ' + resultado);
});
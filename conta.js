var database = firebase.database();

console.log("keep it up");

saldo_atual();

extrato_historico();

//BOTOES
function clicou(tipo) {
    console.log('clicou ' + tipo);
    //muda de bott�o para input
    document.getElementById(tipo + '_div').innerHTML = '<input id="'+tipo+'_input" type="number" placeholder="insira Enter ap�s digitar o valor" onblur=" voltar(\'' + tipo +'\')" onkeypress="teclou(event,this,\''+tipo+'\')" />';
    //foca no input
    document.getElementById(tipo + '_input').focus();

}


function voltar(tipo) {
    console.log('voltou ' + tipo);
    //muda de input para bot�o
    document.getElementById(tipo + '_div').innerHTML = '<input id="botao_'+tipo+'" type="button" value="' + tipo.toUpperCase() + '" onclick="clicou(\'' + tipo+'\')"/>';
}

function teclou(e, texto, tipo) {
    var codigo = (e.keyCode ? e.keyCode : e.which);
    //se apertar enter
    if (codigo == 13) {
        var valor_digitado = parseFloat(document.getElementById(tipo + '_input').value).toFixed(2);

        //se o valor for numero
        if ($.isNumeric(valor_digitado)) {
            //enviar dados
            contar_enviar_firebase(tipo, valor_digitado);

            
        } else {
            alert('DIGITE APENAS N�MEROS');
        }

        //tira o foco ap�s digita��o
        $('#' + tipo + '_input').blur();

    }

    

}



//FIREBASE
function saldo_atual() {
    
    var ref = database.ref('saldo');
    ref.on('value', pegar_dados);

    function pegar_dados(dados) {
        //pegando saldo de dados
        var saldo = parseFloat(dados.val()).toFixed(2);

        if (saldo == 0) {
            //se saldo for zero
            document.getElementById('saldo').innerHTML = "<a style= \"color:grey;\">R$ 0.00</a>";
        } else {
            //pagina recebe saldo
            if (saldo < 0) {
                //se estiver negativo
                document.getElementById('saldo').innerHTML = "<a style= \"color:red;\">R$ " + saldo + "</a>";
            } else {
                document.getElementById('saldo').innerHTML = "<a style= \"color:green;\">R$ " + saldo + "</a>";
            }
        }

        
    }

}


function extrato_historico() {
    var ref = database.ref('extrato');
    ref.on('value', pegar_dados);
    
    function pegar_dados(dados) {
        //limpa ultimo historico
        $('#extrato_historico').html('');
        //coloca dados em um array
        var extratos = Object.values(dados.val());

        //corre pelo array de tras para frente
        for (var x = extratos.length-1; x>=0; x--) {
            if (extratos[x][0] == 's') {
                //se sacou, extrato vermelho
                $('#extrato_historico').append('<li style="color: red">' + extratos[x] + '</li>');
            } else {
                //se depositou, extrato verde
                $('#extrato_historico').append('<li style="color: green">' + extratos[x] + '</li>');
            }
            
        }
    }

    

}


function contar_enviar_firebase(tipo, valor) {
    console.log('tipo: ' + tipo + '\nvalor: ' + valor);

    var ref = database.ref('cont_extrato');
    ref.once('value', pegar_dados);

    function pegar_dados(dados) {
        //pega contagem de extratos
        enviar_firebase(tipo, valor, dados.val());
    }



}


function enviar_firebase(tipo, valor, cont) {
    //cria variavel com verbo no passado
    var tipo_str;
    if (tipo == 'depositar') {
        tipo_str = 'depositou R$ ';
    } else {
        tipo_str = 'sacou R$ ';
    }

    //adiciona a extratos
    var ref = database.ref();
    ref.child('extrato/extrato_' + cont).set(tipo_str + valor);
    //aumenta contagem
    cont++;
    //envia contagem
    ref.child('cont_extrato').set(cont);
    //muda saldo do firebase
    mudar_saldo(tipo, valor);


}

function mudar_saldo(tipo, valor) {
    var ref = database.ref('saldo');
    ref.once('value', pegar_dados);

    function pegar_dados(ant_saldo) {

        if (tipo == 'depositar') {
            //aumenta valor de antigo saldo
            database.ref().child('saldo').set(parseFloat(ant_saldo.val()) + parseFloat(valor));
        } else {
            if (tipo == 'sacar') {
                //desconta valor de antigo saldo
                database.ref().child('saldo').set(parseFloat(ant_saldo.val()) - parseFloat(valor));
            } else {
                //mensagem de erro
                console.log('algo occoreu errado ao mudar de saldo');
            }
        }
        
    }

}

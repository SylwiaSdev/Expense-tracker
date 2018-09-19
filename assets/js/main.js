// firebase config
var config = {
    apiKey: "AIzaSyA2KhjSNa0S5UJ2bWLwknU4GrKgq5VtU-o",
    authDomain: "wallet-fe4c7.firebaseapp.com",
    databaseURL: "https://wallet-fe4c7.firebaseio.com",
    projectId: "wallet-fe4c7",
    storageBucket: "wallet-fe4c7.appspot.com",
    messagingSenderId: "380648602583"
};
firebase.initializeApp(config);

var cards_database = firebase.database().ref('/cards');
cards_database.on('value', function(data) {
    console.log(data.val());
    updateCards(data.val());
});

var transactionsToFilter;
var selectedFilter;

var transactions_database = firebase.database().ref('/transactions');
transactions_database.on('value', function(data) {
    transactionsToFilter=data.val();
    console.log(data.val());
    updateTransactions(data.val());
    updateSume(data.val());
});

function updateTransactions(newTransactions) {
    $(".list").html("");
    if (Object.keys(newTransactions).length>0) {
        $.each(newTransactions, function(k,v) {
            var transactionsHTML = '<li class="listInfo">'+
            '<div class="icon">'+(v.is_expense?"-":"+")+'</div>'+
            '<div class="decription">'+
            '<div class="dealTitle">'+v.title+'</div>'+
            '<div class="dealInfo">'+v.description+'</div>'+'</div>'+
            '<div class="price">'+v.amount+ " PLN"+'</div>'+'</li>'
            $(".list").append(transactionsHTML);   
        });
    } else {
        $(".list").append('<div class="noTransactions"> No transactions</div>');
    }
};



function updateCards(newCards) {
    $(".cardsList").html("");
    if (Object.keys(newCards).length>0) {

        $.each(newCards, function(k,v) {
            var cardsHTML = '<li class="card">'+
            '<div class="cardPlace" id='+v.name+'></div>'+'</li>'
            $(".cardsList").append(cardsHTML);
        });
        
        $("#filterCards .cardPlace").on("click", function(){
            var card_name = $(this).attr("id");
            if (selectedFilter != undefined || selectedFilter == card_name) {
                $(".cardPlace").removeClass("cardPlaceActiv");
                filterTransactions(card_name, false);
                selectedFilter = undefined;
            } else {
                $(".cardPlace").removeClass("cardPlaceActiv");
                $(this).toggleClass("cardPlaceActiv");
                filterTransactions(card_name, true);
                selectedFilter = card_name;
            }
        });

        $(".popupFormTransactions .card").on("click", function(){
            $(".popupFormTransactions .card").removeAttr("selected_card")
                .find(".cardPlace").removeClass("cardPlaceSelected");
            $(this).attr("selected_card", true).find(".cardPlace").addClass("cardPlaceSelected");
        });

    } else {
        $(".cardsList").append('<div class="noCards"> No cards</div>');
    }
    $(".card").height($(".card").width()*0.43);
};


function filterTransactions(card_name, isFilterOn) {    
    $(".list").html("");
    if (Object.keys(transactionsToFilter).length>0) {
        $.each(transactionsToFilter, function(k,v) {
            var transactionsHTML = '<li class="listInfo">'+
            '<div class="icon">'+(v.is_expense?"-":"+")+'</div>'+
            '<div class="decription">'+
            '<div class="dealTitle">'+v.title+'</div>'+
            '<div class="dealInfo">'+v.description+'</div>'+'</div>'+
            '<div class="price">'+v.amount+ " PLN"+'</div>'+'</li>'
            if(card_name==v.used_card || !isFilterOn){
                $(".list").append(transactionsHTML);
            }  
        });
    } else {
        $(".list").append('<div class="noTransactions"> No transactions</div>');
    }
};

$(document).ready(function(){
    resize();
    $("#newTransaction").on("click", showDropdown);
    $("#addTransaction").on("click", saveTransaction);
    $(".buttomSaveCard").on("click",saveCard);
    $("#amountTransaction").on('keyup', function(){
        prepareTransaction();
    });
    $("#descriptionTransaction").on('keyup', function(){
        prepareTransaction();
    });
    $("#titleTransaction").on('keyup', function(){
        prepareTransaction();
    });
    $("#typeOfCards").on("keyup", function(){
        prepareCard();
    });
    $(".number").on("keyup", function(){
        prepareCard();
    });
    $("#experationDate").on("change", function(){
        prepareCard();
    });
});

function saveTransaction() {
    var transaction = prepareTransaction();
    if (validateTransacion(transaction)) {
        transactions_database.push(transaction).then(function(){
            hideTransactionPopup();
            clearTransaction();
        });
    }
}


function prepareTransaction() {
    var transaction = {
        amount: amuntToInt($("#amountTransaction").val()),
        description: $("#descriptionTransaction").val(),
        is_expense: $("#typeOfTransactions").val().toBoolean(),
        title: $("#titleTransaction").val(),
        used_card: $(".cardPlaceSelected").attr("id")
    }
    validateTransacion(transaction);
    return transaction;
}

function amuntToInt(amount) {
    if (amount==""){
        return 0;
    } else {
        return parseInt(amount);
    }
}

function clearTransaction() {
    $("#amountTransaction").val("");
    $("#descriptionTransaction").val("");
    $("#titleTransaction").val("");
    $("#typeOfTransactions").val("true");
}

function validateTransacion(transaction) {
    var errors = 0;
    var errorsValueHTML = "<ul>";
    // validating
    if (transaction.amount <= 0) {
        errorsValueHTML+="<li>Kwota musi być większa od 0</li>";
        errors++;
    }
    if (transaction.description.length < 6) {
        errorsValueHTML+="<li>Opis musi mieć więcej niz 6 znaków</li>";
        errors++;
    }
    if (transaction.title == "" || transaction.title == undefined) {
        errorsValueHTML+="<li>Tytuł nie moze być pusty</li>";
        errors++;
    }
    errorsValueHTML+="</ul>";

    if (errors == 0) {
        $(".errorInfo").hide();
        return true;
    } else {
        showErrorInformation();
        $(".errorInfo").html(errorsValueHTML);
        return false;
    }
    
}

function showErrorInformation() {
    $(".errorInfo").show();
}

function saveCard() {
    var card = prepareCard();
    if (validateCard(card)){
        cards_database.push(card).then(function(){
            hideCradsPopup();
            clearCard();
        })
    }
}

function prepareCard() {
    var card = {
        name: $("#typeOfCards").val(),
        card_number: getCardNumber(),
        experation_date: $("#experationDate").val()  
    }
    validateCard(card);
    return card;
}

function getCardNumber() {
    var cardNumberValues = [];
    $(".number").each(function(k, v) {
        cardNumberValues.push($(v).val());
    })
    return cardNumberValues.join('-')
}

function validateCard(card) {
    var errors=0;
    var errorsHTML = "<ul>";
    if (card.name=="" || card.name==undefined){
        errorsHTML+="<li>Please specify the type of card</li>";
        errors++;
    }

    if(errors==0){
        $(".error").hide();
        return true;
    }else {
        showErrorCardInfo();
        $(".error").html(errorsHTML);
        return false;

    }
}

function showErrorCardInfo() {
    $(".error").show();
}

function clearCard() {
    $("#typeOfCards").val("");
    $(".number").val("");
    $("#experationDate").val("");
}

function showDropdown(){
    $("#dropdown").css({"display":"block"});
    $("#elDropdown").css({"display":"block"});
    $(".dropdownOverlay").show();
};


function hideDropdown(){
    $("#dropdown").hide();
    $("#elDropdown").hide();
    $(".dropdownOverlay").hide();
};

$(".dropdownOverlay").on("click", function(){
    hideDropdown();
});

$("#transactionsBottom").on("click", function() {
    showTransactionPopup();
    hideDropdown();
});

function showTransactionPopup() {
    $(".popupHolder").css({"display":"flex"});
};

function hideTransactionPopup(){
    $(".popupHolder").hide();
};

$(".popupHolder").on("click", function() {
    hideTransactionPopup();
});

$(".popupFormTransactions").on("click", function(e){
    e.stopPropagation();
});

$("#cardsBottom").on("click", function(){
    showCradsPopup();
    hideDropdown();
});

function showCradsPopup() {
    $(".popupCardsHolder").css({"display":"flex"});
};

$(".popupCardsHolder").on("click", function(){
    hideCradsPopup();
})

$(".poupFormCards").on("click", function(e){
    e.stopPropagation();
})

function hideCradsPopup() {
    $(".popupCardsHolder").hide();
};

$(window).on("resize", resize);


function resize(){
    var rect = $("#newTransaction")[0].getBoundingClientRect();
    var left = rect.left+(rect.width/2)-($("#elDropdown").width()/2);
    $("#elDropdown").css({'left':left+'px'});
    var leftDropdown = rect.left+(rect.width/2)-($("#dropdown").width()/2);
    $("#dropdown").css({'left':leftDropdown+'px'});
    $(".card").height($(".card").width()*0.43);
    var rectIcon = $(".addIcon")[0].getBoundingClientRect();
    var left = rectIcon.left+(rectIcon.width/2)-($(".mobileElDropdown").width()/2);
    $(".mobileElDropdown").css({'left':left+'px'});
    var leftDropdownMobile = rectIcon.left*0.53;
    $(".mobileDropdown").css({'left':leftDropdownMobile+'px'});

}


$(".bar").on("click", function(){
    showSideMenu();
    $(".MobileDropdownOverlay").show();
});

function showSideMenu() {
    $(".aside").css({"margin-left":"0"});
}
 
function showMobileDropdown() {
    $(".mobileDropdown").show();
    $(".mobileElDropdown").show();
    $(".MobileDropdownOverlay").show();
}

function hideMobileDropdown() {
    $(".mobileDropdown").hide();
    $(".mobileElDropdown").hide();
    $(".MobileDropdownOverlay").hide();
}

$(".addIcon").on("click", showMobileDropdown)

$("#mobileCard").on("click", function(){
    showCradsPopup();
    hideMobileDropdown();
});

$("#mobileTransaction").on("click", function() {
    showTransactionPopup();
    hideMobileDropdown();
});

$(".closeButton").on("click", hideCradsPopup);


$(".closeButtonTransaction").on("click", function() {
    $(".popupHolder").css({"display":"none"})
});

$(".MobileDropdownOverlay").on("click", function() {
    hideMobileDropdown();
    hideSideMenu();
});


function hideSideMenu() {
    $(".aside").css({"margin-left":"-50%"});
}


String.prototype.toBoolean = function(){
	if (this == "true") {
		return true;
	} else {
		return false;
	}
}


function updateSume(transactions) {
    var sume = 0;
    if (Object.keys(transactions).length>0) {
        $.each(transactions, function(k,v) {
            if(v.is_expense==true){
                sume -= v.amount;
            } else {
                sume += v.amount;
            }
        });
    }
    $(".saldo").text(sume+" PLN");
}


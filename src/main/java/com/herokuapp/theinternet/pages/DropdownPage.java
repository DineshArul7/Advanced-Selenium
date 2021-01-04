package com.herokuapp.theinternet.pages;

import org.apache.logging.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;

public class DropdownPage extends BasePageObject{

	private By dropdown=By.id("dropdown");
	public DropdownPage(WebDriver driver,Logger log) {
		super(driver,log);
	}
	
	public void selectOption(int option) {
		log.info("Selecting option "+option+" from dropdown");
		WebElement dropdownelement=find(dropdown);
		Select dropdown=new Select(dropdownelement);
		dropdown.selectByValue(""+option);		
	}
	
	public String getSelectedOption() {
		WebElement dropdownelement=find(dropdown);
		Select dropdown=new Select(dropdownelement);
		String selectedOption=dropdown.getFirstSelectedOption().getText();
		log.info(selectedOption+" is Selected");
		return selectedOption;
	}

}

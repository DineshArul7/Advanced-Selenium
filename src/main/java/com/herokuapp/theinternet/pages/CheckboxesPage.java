package com.herokuapp.theinternet.pages;

import java.util.List;

import org.apache.logging.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class CheckboxesPage extends BasePageObject{

	private By checkbox=By.xpath("//input[@type='checkbox']");
	
	public CheckboxesPage(WebDriver driver,Logger log) {
		super(driver,log);
	}
	
	public void selectAllCheckboxes() {
		log.info("checking all unchecked checkboxes");
		List<WebElement> checkboxes=findAll(checkbox);
		for(WebElement checkbox:checkboxes) {
			if(!checkbox.isSelected()) {
				checkbox.click();
			}
		}
	}
	
	
	public boolean areAllCheckboxesChecked() {
		log.info("Verfying that all checkboxes are checked");
		List<WebElement> checkboxes=findAll(checkbox);
		for(WebElement checkbox:checkboxes) {
			if(!checkbox.isSelected()) {
				return false; 
			}
		}
		return true;
	}

}

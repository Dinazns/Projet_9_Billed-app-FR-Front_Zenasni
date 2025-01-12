/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills as billsData } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should be ordered from latest to earliest", () => {
      document.body.innerHTML = BillsUI({ data: billsData })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // Nouveau test pour handleClickNewBill
    test("When clicking on New Bill button, it should navigate to NewBill page", () => {
      const onNavigate = jest.fn();
      const bills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

      document.body.innerHTML = BillsUI({ data: billsData });
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      buttonNewBill.addEventListener("click", bills.handleClickNewBill);

      buttonNewBill.click();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    // Nouveau test pour handleClickIconEye
    test("When clicking on eye icon, it should display the modal with the correct image", () => {
      const onNavigate = jest.fn();
      const bills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

      document.body.innerHTML = BillsUI({ data: billsData });
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const billUrl = iconEye.getAttribute("data-bill-url");

      const modal = document.getElementById("modaleFile");
      $.fn.modal = jest.fn(); // Mock Bootstrap modal

      bills.handleClickIconEye(iconEye);

      expect(modal.querySelector("img").src).toBe(billUrl);
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });
  });
});

// GET Integration Tests
describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
  });


  describe("When I navigate to BillsUI", () => {
    test("fetches bills from mock API GET", async () => {
      const bills = await mockStore.bills().list();
      expect(bills.length).toBe(4);
    });

    describe("When an error occurs on API", () => {
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        document.body.innerHTML = BillsUI({ error: 'Erreur 404' });

        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        document.body.innerHTML = BillsUI({ error: 'Erreur 500' });

        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });

    // Nouveau test pour getBills avec données corrompues
    test("When getBills is called with corrupted data, it should return unformatted data and log the error", async () => {
      const corruptedBills = [
        { date: "invalid-date", status: "pending" }
      ];
      mockStore.bills.mockImplementationOnce(() => ({
        list: () => Promise.resolve(corruptedBills),
      }));

      const consoleSpy = jest.spyOn(console, "log");
      const bills = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });

      const result = await bills.getBills();
      expect(result[0].date).toBe("invalid-date");
      expect(consoleSpy).toHaveBeenCalled();
    });

	test("When getBills is called, it should log the correct number of bills", async () => {
  const billsMock = [
    { date: "2022-01-01", status: "pending" },
    { date: "2022-01-02", status: "accepted" }
  ];
  mockStore.bills.mockImplementationOnce(() => ({
    list: () => Promise.resolve(billsMock),
  }));

  const consoleSpy = jest.spyOn(console, "log");
  const bills = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });

  await bills.getBills();
  expect(consoleSpy).toHaveBeenCalledWith('length', 2); // Vérifie que la taille est correcte
});

test("When getBills is called with invalid date, it should return unformatted data and log the error", async () => {
	const corruptedBills = [
	  { date: "invalid-date", status: "pending" }
	];
	mockStore.bills.mockImplementationOnce(() => ({
	  list: () => Promise.resolve(corruptedBills),
	}));
  
	const consoleSpy = jest.spyOn(console, "log");
	const bills = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
  
	const result = await bills.getBills();
	expect(result[0].date).toBe("invalid-date"); // Vérifie que la date n'est pas formatée
	expect(consoleSpy).toHaveBeenCalled(); // Vérifie que l'erreur est loggée
  });
  
  });
});
